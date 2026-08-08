import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreateSessionDto } from './create-session.dto';

const validPayload = {
  sessionNumber: 1,
  food: 'Carota',
  foodId: 'carota',
  difficulty: 'facile',
  therapist: 'Mary Major',
  problemBehaviors: ['rifiuto-cibo', 'pianto'],
  notes: 'Bambino stanco a fine sessione.',
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

async function validateDto(payload: unknown) {
  return validate(plainToInstance(CreateSessionDto, payload));
}

describe('CreateSessionDto', () => {
  it('accepts a fully valid payload', async () => {
    expect(await validateDto(validPayload)).toHaveLength(0);
  });

  it('rejects a session number below 1', async () => {
    const errors = await validateDto({ ...validPayload, sessionNumber: 0 });
    expect(errors.map((e) => e.property)).toContain('sessionNumber');
  });

  it('rejects a date that is not a real ISO 8601 timestamp', async () => {
    const errors = await validateDto({ ...validPayload, date: 'ieri pomeriggio' });
    expect(errors.map((e) => e.property)).toContain('date');
  });

  it('rejects an unknown difficulty value (enum)', async () => {
    const errors = await validateDto({ ...validPayload, difficulty: 'impossibile' });
    expect(errors.map((e) => e.property)).toContain('difficulty');
  });

  it('rejects an invalid level mode deep in the nested structure', async () => {
    const bad = {
      ...validPayload,
      levels: [{ ...validPayload.levels[0], mode: 'wiggle' }],
    };
    const errors = await validateDto(bad);
    expect(errors.map((e) => e.property)).toContain('levels');
  });

  it('rejects a non-numeric touch timestamp (nested touches validation)', async () => {
    const bad = {
      ...validPayload,
      levels: [
        {
          ...validPayload.levels[0],
          metrics: {
            ...validPayload.levels[0].metrics,
            touches: [{ down: 'nope', up: 1200, duration: 400 }],
          },
        },
      ],
    };
    const errors = await validateDto(bad);
    expect(errors.map((e) => e.property)).toContain('levels');
  });

  it('treats optional metadata (foodId, difficulty) as omittable', async () => {
    const { foodId, difficulty, ...rest } = validPayload;
    void foodId;
    void difficulty;
    expect(await validateDto(rest)).toHaveLength(0);
  });

  it('accepts a session recorded without therapist or problem behaviours', async () => {
    const { therapist, problemBehaviors, notes, ...rest } = validPayload;
    void therapist;
    void problemBehaviors;
    void notes;
    expect(await validateDto(rest)).toHaveLength(0);
  });

  it('rejects problem behaviours that are not a list of strings', async () => {
    const errors = await validateDto({ ...validPayload, problemBehaviors: [1, 2] });
    expect(errors.map((e) => e.property)).toContain('problemBehaviors');
  });

  it('rejects a non-string therapist', async () => {
    const errors = await validateDto({ ...validPayload, therapist: 42 });
    expect(errors.map((e) => e.property)).toContain('therapist');
  });
});
