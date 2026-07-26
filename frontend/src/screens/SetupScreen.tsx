import { useState } from 'react';
import { FOODS, getFood } from '../game/levels';
import Rabbit from '../shared/Rabbit';
import { nextSessionNumber } from '../utils/foodProgress';
import type { ProgressByFood } from '../utils/foodProgress';
import type { Difficulty } from '../types';
import s from '../styles/shared.module.scss';
import c from './SetupScreen.module.scss';

export interface StartParams {
  sessionNumber: number;
  foodId: string;
  difficulty: Difficulty;
}

const DIFFICULTIES: { id: Difficulty; emoji: string; label: string; hint: string }[] = [
  { id: 'facile', emoji: '🌱', label: 'Facile', hint: 'tocchi liberi' },
  { id: 'difficile', emoji: '🎵', label: 'Difficile', hint: 'tocchi a tempo (piano tiles)' },
];

interface SetupScreenProps {
  childId: string;
  progressByFood?: ProgressByFood;
  progressLoading?: boolean;
  onStart: (params: StartParams) => void;
  onOpenDashboard: () => void;
  onOpenSettings: () => void;
  onLogout: () => void;
}

const SetupScreen = ({
  childId,
  progressByFood = {},
  progressLoading = false,
  onStart,
  onOpenDashboard,
  onOpenSettings,
  onLogout,
}: SetupScreenProps) => {
  const [manualNumber, setManualNumber] = useState<number | null>(null);
  const [foodId, setFoodId] = useState(FOODS[0].id);
  const [foodQuery, setFoodQuery] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('facile');

  const query = foodQuery.trim().toLowerCase();
  const visibleFoods = query
    ? FOODS.filter((f) => f.label.toLowerCase().includes(query))
    : FOODS;

  // The proposed number follows the selected food until the therapist overrides it.
  const food = getFood(foodId);
  const progress = progressByFood[foodId];
  const sessionNumber = manualNumber ?? nextSessionNumber(progress);

  const selectFood = (id: string) => {
    setFoodId(id);
    setManualNumber(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onStart({ sessionNumber: Number(sessionNumber), foodId, difficulty });
  };

  return (
    <div className={s.screen}>
      <Rabbit mood="happy" message="Iniziamo a cucinare!" />
      <h1>La Fattoria del Coniglio Cuoco</h1>

      <div className={c.childBar}>
        <span>
          Bambino: <strong>{childId}</strong>
        </span>
        <button type="button" className={c.linkBtn} onClick={onLogout}>
          cambia bambino
        </button>
      </div>

      <form className={`${s.card} ${s.setupForm}`} onSubmit={submit}>
        <label>
          Numero sessione
          <input
            type="number"
            min="1"
            value={sessionNumber}
            onChange={(e) =>
              setManualNumber(e.target.value === '' ? null : Number(e.target.value))
            }
          />
          <p className={c.progressHint}>
            {progressLoading
              ? 'Carico lo storico del bambino…'
              : progress
                ? `Ultima con ${food.emoji} ${food.label}: n.${progress.lastSessionNumber} del ${new Date(progress.lastDate).toLocaleDateString('it-IT')}`
                : `Prima sessione con ${food.emoji} ${food.label}`}
          </p>
        </label>

        <label>
          Alimento da testare
          <input
            type="search"
            className={c.foodSearch}
            placeholder="Cerca un alimento…"
            value={foodQuery}
            onChange={(e) => setFoodQuery(e.target.value)}
          />
          <div className={c.foodPicker}>
            {visibleFoods.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`${c.foodChip} ${foodId === f.id ? c.foodChipSelected : ''}`}
                onClick={() => selectFood(f.id)}
              >
                <span className={s.foodChipEmoji}>{f.emoji}</span>
                {f.label}
              </button>
            ))}
            {visibleFoods.length === 0 && (
              <p className={c.foodEmpty}>Nessun alimento trovato.</p>
            )}
          </div>
        </label>

        <label>
          Difficoltà
          <div className={c.foodPicker}>
            {DIFFICULTIES.map((d) => (
              <button
                type="button"
                key={d.id}
                className={`${c.foodChip} ${difficulty === d.id ? c.foodChipSelected : ''}`}
                onClick={() => setDifficulty(d.id)}
                title={d.hint}
              >
                <span className={s.foodChipEmoji}>{d.emoji}</span>
                {d.label}
              </button>
            ))}
          </div>
        </label>

        <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
          Inizia la storia ▶
        </button>
        <button type="button" className={s.btn} onClick={onOpenDashboard}>
          📊 Sessioni salvate
        </button>
        <button type="button" className={s.btn} onClick={onOpenSettings}>
          ⚙️ Impostazioni
        </button>
      </form>
    </div>
  );
};

export default SetupScreen;
