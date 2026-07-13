import type { Food, Level } from '../types';
import { FOODS } from './foods';

// Re-exported so existing imports (`import { FOODS } from '../game/levels'`)
// keep working; the catalogue itself lives in `./foods`.
export { FOODS };

/**
 * The three levels of the Rabbit Cook story, in order:
 * 1) La Raccolta (fingertip touch), 2) L'Annusata (nose contact),
 * 3) L'Assaggio (lips / tongue contact).
 */
export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'La Raccolta',
    behavior: 'Approccio e contatto con le dita',
    mode: 'count',
    target: 5,
    quickTouchMs: 600,
    // Cadenza fissa: il bambino impara il ritmo prima che diventi imprevedibile.
    hardBeat: { onMs: [600, 600], offMs: [700, 700], score: 'tap' },
    intro: ({ foodLabel }) =>
      `Benvenuto alla Fattoria del Coniglio! \n\n` +
      `Il piccolo Coniglio vive in una grande fattoria piena di cibi colorati. ` +
      `Oggi deve preparare ${foodLabel.toLowerCase()}!\n\n` +
      `Aiutalo a raccoglierle: tocca ${foodLabel.toLowerCase()} per metterla nel cesto. ` +
      `Toccala più volte, una dopo l'altra!`,
    hint: 'Tocca il cibo per raccoglierlo',
    progressLabel: (done, target) => `Raccolte ${done} / ${target}`,
  },
  {
    id: 2,
    name: "L'Annusata",
    behavior: 'Sollevare e avvicinare al viso, annusare',
    mode: 'hold',
    target: 6,
    quickTouchMs: 800,
    // Attesa e tenuta randomizzate: il bambino non può anticipare il ritmo.
    hardBeat: { onMs: [600, 1400], offMs: [700, 1500], score: 'hold' },
    intro: ({ foodLabel }) =>
      `Il coniglietto ha raccolto ${foodLabel.toLowerCase()}! 👃\n\n` +
      `Ora deve controllare che vada bene. Avvicina ${foodLabel.toLowerCase()} al naso ` +
      `e annusala con calma.\n\n` +
      `Mantieni il contatto per riempire la barra: prima tocchi brevi, poi più lunghi.`,
    hint: 'Tocca e mantieni con il naso',
    progressLabel: (done, target) =>
      `Profumo ${Math.min(100, Math.round((done / target) * 100))}%`,
  },
  {
    id: 3,
    name: "L'Assaggio",
    behavior: 'Contatto con labbra / lingua',
    mode: 'hold',
    target: 5,
    quickTouchMs: 800,
    // Come il livello 2, ma con finestre più lunghe e pause più imprevedibili.
    hardBeat: { onMs: [900, 2000], offMs: [800, 2000], score: 'hold' },
    intro: ({ foodLabel }) =>
      `${foodLabel} è pronta! \n\n` +
      `Il coniglietto chiama i suoi amici e distribuisce una fetta ciascuno. ` +
      `È il momento dell'assaggio!\n\n` +
      `Tocca ${foodLabel.toLowerCase()} con le labbra o la lingua. ` +
      `Prima tocchi brevi, poi più lunghi.`,
    hint: 'Tocca con labbra / lingua',
    progressLabel: (done, target) =>
      `Assaggio ${Math.min(100, Math.round((done / target) * 100))}%`,
  },
];

/**
 * Returns the food item with the given id, falling back to the first entry.
 * @param foodId - Technical id of the food (e.g. `'carota'`), or `undefined`.
 * @returns The matching {@link Food}, or `FOODS[0]` if not found.
 */
export function getFood(foodId: string | undefined): Food {
  return FOODS.find((f) => f.id === foodId) ?? FOODS[0];
}

/**
 * Returns the level with the given id, falling back to level 1.
 * @param levelId - Numeric id of the level (1–3).
 * @returns The matching {@link Level}, or `LEVELS[0]` if not found.
 */
export function getLevel(levelId: number): Level {
  return LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
}
