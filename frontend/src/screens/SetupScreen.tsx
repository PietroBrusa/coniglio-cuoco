import { useState } from 'react';
import { FOODS } from '../game/levels';
import Rabbit from '../shared/Rabbit';
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
  /** Identifier of the currently logged-in child (displayed in the header bar). */
  childId: string;
  /**
   * Called with the chosen parameters when the form is submitted.
   * @param params - Session number, food id and difficulty.
   */
  onStart: (params: StartParams) => void;
  /** Called when the child clicks the saved-sessions button. */
  onOpenDashboard: () => void;
  /** Called when the therapist clicks "change child" to log out. */
  onLogout: () => void;
}

/**
 * Setup screen: the therapist selects session number, food and difficulty.
 * Emits the chosen parameters via `onStart`; also provides access to the
 * dashboard and the logout action.
 */
const SetupScreen = ({ childId, onStart, onOpenDashboard, onLogout }: SetupScreenProps) => {
  const [sessionNumber, setSessionNumber] = useState(1);
  const [foodId, setFoodId] = useState(FOODS[0].id);
  const [difficulty, setDifficulty] = useState<Difficulty>('facile');

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
            onChange={(e) => setSessionNumber(Number(e.target.value))}
          />
        </label>

        <label>
          Alimento da testare
          <div className={c.foodPicker}>
            {FOODS.map((f) => (
              <button
                type="button"
                key={f.id}
                className={`${c.foodChip} ${foodId === f.id ? c.foodChipSelected : ''}`}
                onClick={() => setFoodId(f.id)}
              >
                <span className={s.foodChipEmoji}>{f.emoji}</span>
                {f.label}
              </button>
            ))}
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
      </form>
    </div>
  );
};

export default SetupScreen;
