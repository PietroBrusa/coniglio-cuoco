import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { AppModule } from '../src/app.module';

/**
 * END-TO-END tests for the whole backend.
 *
 * Unlike the unit tests, NOTHING is mocked here: the full NestJS application is
 * bootstrapped and driven through real HTTP requests (Supertest), and it talks
 * to a REAL MongoDB spun up on the fly by Testcontainers. When the suite ends
 * the container is torn down, so no external infrastructure is required — only
 * a running Docker engine.
 *
 * This is the highest-confidence layer of the pyramid: auth, the JWT guard,
 * validation, the ownership rules and MongoDB persistence are all exercised
 * together, exactly as a client would experience them.
 */
describe('Backend E2E (auth + sessions)', () => {
  let app: INestApplication;
  let mongo: StartedMongoDBContainer;

  // A complete, valid session payload (mirrors what the frontend sends).
  const sessionPayload = {
    sessionNumber: 1,
    food: 'Carota',
    foodId: 'carota',
    difficulty: 'facile',
    date: new Date().toISOString(),
    levels: [
      {
        levelId: 1,
        levelName: 'La Raccolta',
        behavior: 'Approccio e contatto con le dita',
        mode: 'count',
        target: 5,
        metrics: {
          n: 3,
          latencyMs: 800,
          totalContactMs: 1200,
          meanTouchMs: 400,
          meanIrtMs: 250,
          sessionDurationMs: 5000,
          engagementRatio: 24,
          touches: [{ down: 800, up: 1200, duration: 400 }],
        },
      },
    ],
  };

  beforeAll(async () => {
    // 1. Start a throwaway MongoDB in a container and point the app at it.
    // Testcontainers runs Mongo as a single-node replica set, which advertises
    // the container's internal hostname during topology discovery. From the host
    // that hostname is unresolvable, so we force `directConnection=true` to skip
    // discovery and talk straight to the mapped port.
    mongo = await new MongoDBContainer('mongo:7').start();
    process.env.MONGODB_URI = `${mongo.getConnectionString()}/?directConnection=true`;
    process.env.MONGODB_DB = 'coniglio_cuoco_test';
    process.env.JWT_SECRET = 'e2e-secret';

    // 2. Bootstrap the real application (same config as src/main.ts).
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  }, 120_000);

  afterAll(async () => {
    await app?.close();
    await mongo?.stop();
  });

  // Tokens obtained during the flow, reused across tests (ordered execution).
  let frodoToken: string;
  let sessionId: string;

  describe('authentication', () => {
    it('POST /auth/register creates an account and returns a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Frodo', password: 'shire123' })
        .expect(201);

      expect(res.body).toEqual(
        expect.objectContaining({ name: 'Frodo', access_token: expect.any(String) }),
      );
      frodoToken = res.body.access_token;
    });

    it('POST /auth/register rejects a duplicate name with 409', () =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Frodo', password: 'other' })
        .expect(409));

    it('POST /auth/register rejects an invalid body with 400 (ValidationPipe)', () =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'x', password: '1' }) // password too short
        .expect(400));

    it('POST /auth/login fails with 401 on wrong password', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: 'Frodo', password: 'wrong' })
        .expect(401));

    it('POST /auth/login succeeds with correct credentials', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: 'Frodo', password: 'shire123' })
        .expect(200));
  });

  describe('sessions (JWT-protected)', () => {
    it('GET /sessions without a token is rejected with 401', () =>
      request(app.getHttpServer()).get('/sessions').expect(401));

    it('POST /sessions persists a session scoped to the authenticated child', async () => {
      const res = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${frodoToken}`)
        .send(sessionPayload)
        .expect(201);

      expect(res.body).toEqual(
        expect.objectContaining({ childId: 'Frodo', food: 'Carota', sessionNumber: 1 }),
      );
      sessionId = res.body._id;
      expect(sessionId).toBeDefined();
    });

    it('GET /sessions returns the child\'s sessions', async () => {
      const res = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${frodoToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]._id).toBe(sessionId);
    });

    it('GET /sessions/:id returns the owned session', () =>
      request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${frodoToken}`)
        .expect(200));

    it('another child cannot read the session (ownership → 404)', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Sam', password: 'potatoes' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${body.access_token}`)
        .expect(404);
    });

    it('DELETE /sessions/:id removes the session, after which it is gone', async () => {
      await request(app.getHttpServer())
        .delete(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${frodoToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${frodoToken}`)
        .expect(404);
    });
  });
});
