import type { Food, Level } from '../types';
import { FOODS } from './foods';

export { FOODS };

export const LEVELS: Level[] = [
  {
    id: 1,
    name: 'La Raccolta',
    behavior: 'Approccio e contatto con le dita',
    mode: 'hold',
    target: 6,
    hardBeat: { onMs: [600, 600], offMs: [700, 700], score: 'tap' },
    intro: ({ foodLabel }) =>
      `Benvenuto alla Fattoria del Coniglio! \n\n` +
      `Il piccolo Coniglio vive in una grande fattoria piena di cibi colorati. ` +
      `Oggi deve preparare ${foodLabel.toLowerCase()}!\n\n` +
      `Aiutalo a raccoglierle: tocca ${foodLabel.toLowerCase()} con le dita ` +
      `e tienila per riempire il cesto.`,
    hint: 'Tocca e tieni il cibo con le dita',
    progressLabel: (done, target) =>
      `Cesto ${Math.min(100, Math.round((done / target) * 100))}%`,
  },
  {
    id: 2,
    name: "L'Annusata",
    behavior: 'Sollevare e avvicinare al viso, annusare',
    mode: 'hold',
    target: 6,
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
    target: 6,
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

export function getFood(foodId: string | undefined): Food {
  return FOODS.find((f) => f.id === foodId) ?? FOODS[0];
}

export function getLevel(levelId: number): Level {
  return LEVELS.find((l) => l.id === levelId) ?? LEVELS[0];
}
