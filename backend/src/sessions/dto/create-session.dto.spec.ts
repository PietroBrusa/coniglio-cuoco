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
      mode: 'hold',
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

  it('rejects a mode other than the one the levels use', async () => {
    const bad = {
      ...validPayload,
      levels: [{ ...validPayload.levels[0], mode: 'count' }],
    };
    const errors = await validateDto(bad);
    expect(errors.map((e) => e.property)).toContain('levels');
  });

  // Ogni campo del record è obbligatorio: un'assenza e un valore vuoto direbbero
  // la stessa cosa, e ammettere solo il secondo tiene tutte le sessioni della
  // stessa forma. Chi rilegge i dati non deve chiedersi se un campo mancante
  // significhi «non osservato» o «salvato da una versione che non lo aveva».
  it.each(['foodId', 'difficulty', 'therapist', 'problemBehaviors', 'notes'])(
    'rejects a payload without %s',
    async (field) => {
      const rest = { ...validPayload };
      delete (rest as Record<string, unknown>)[field];
      const errors = await validateDto(rest);
      expect(errors.map((e) => e.property)).toContain(field);
    },
  );

  it('accepts an empty therapist, no problem behaviours and no notes', async () => {
    const payload = { ...validPayload, therapist: '', problemBehaviors: [], notes: '' };
    expect(await validateDto(payload)).toHaveLength(0);
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
