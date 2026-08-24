import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { MongoDBContainer, StartedMongoDBContainer } from '@testcontainers/mongodb';
import { AppModule } from '../src/app.module';

describe('Backend E2E (auth + sessions)', () => {
  let app: INestApplication;
  let mongo: StartedMongoDBContainer;

  const sessionPayload = {
    sessionNumber: 1,
    food: 'Carota',
    foodId: 'carota',
    difficulty: 'facile',
    therapist: 'Mary Major',
    problemBehaviors: ['rifiuto-cibo'],
    notes: 'Bambino collaborativo.',
    date: new Date().toISOString(),
    levels: [
      {
        levelId: 1,
        levelName: 'La Raccolta',
        behavior: 'Approccio e contatto con le dita',
        mode: 'hold',
        target: 5,
        metrics: {
          count: 3,
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
    mongo = await new MongoDBContainer('mongo:7').start();
    process.env.MONGODB_URI = `${mongo.getConnectionString()}/?directConnection=true`;
    process.env.MONGODB_DB = 'coniglio_cuoco_test';
    process.env.JWT_SECRET = 'e2e-secret';

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

  let userToken: string;
  let sessionId: string;

  describe('authentication', () => {
    it('POST /auth/register creates an account and returns a token', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'John Doe', password: 'password123' })
        .expect(201);

      expect(res.body).toEqual(
        expect.objectContaining({ name: 'John Doe', access_token: expect.any(String) }),
      );
      userToken = res.body.access_token;
    });

    it('POST /auth/register rejects a duplicate name with 409', () =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'John Doe', password: 'other' })
        .expect(409));

    it('POST /auth/register rejects an invalid body with 400 (ValidationPipe)', () =>
      request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'x', password: '1' })
        .expect(400));

    it('POST /auth/login fails with 401 on wrong password', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: 'John Doe', password: 'wrong' })
        .expect(401));

    it('POST /auth/login succeeds with correct credentials', () =>
      request(app.getHttpServer())
        .post('/auth/login')
        .send({ name: 'John Doe', password: 'password123' })
        .expect(200));
  });

  describe('sessions (JWT-protected)', () => {
    it('GET /sessions without a token is rejected with 401', () =>
      request(app.getHttpServer()).get('/sessions').expect(401));

    it('POST /sessions persists a session scoped to the authenticated child', async () => {
      const res = await request(app.getHttpServer())
        .post('/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .send(sessionPayload)
        .expect(201);

      expect(res.body).toEqual(
        expect.objectContaining({
          childId: 'John Doe',
          food: 'Carota',
          foodId: 'carota',
          sessionNumber: 1,
          difficulty: 'facile',
          therapist: 'Mary Major',
          problemBehaviors: ['rifiuto-cibo'],
          notes: 'Bambino collaborativo.',
        }),
      );
      sessionId = res.body._id;
      expect(sessionId).toBeDefined();
    });

    // Ogni campo del record è obbligatorio: il contratto lo dichiara e questa
    // verifica lo controlla sul filo, non solo sul DTO isolato. È la prova che
    // un client disallineato riceve un rifiuto invece di scrivere un documento
    // a cui manca un pezzo.
    it.each(['foodId', 'difficulty', 'therapist', 'problemBehaviors', 'notes'])(
      'POST /sessions rejects a payload without %s',
      async (field) => {
        const incomplete = { ...sessionPayload };
        delete (incomplete as Record<string, unknown>)[field];

        await request(app.getHttpServer())
          .post('/sessions')
          .set('Authorization', `Bearer ${userToken}`)
          .send(incomplete)
          .expect(400);
      },
    );

    it('GET /sessions returns the child\'s sessions', async () => {
      const res = await request(app.getHttpServer())
        .get('/sessions')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body).toHaveLength(1);
      expect(res.body[0]._id).toBe(sessionId);
    });

    it('GET /sessions/:id returns the owned session', () =>
      request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200));

    it('another child cannot read the session (ownership → 404)', async () => {
      const { body } = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ name: 'Jane Doe', password: 'pass7890' })
        .expect(201);

      await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${body.access_token}`)
        .expect(404);
    });

    it('DELETE /sessions/:id removes the session, after which it is gone', async () => {
      await request(app.getHttpServer())
        .delete(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);

      await request(app.getHttpServer())
        .get(`/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(404);
    });
  });
});
