import { useState } from 'react';
import { FOODS, getFood } from '@/domain/levels';
import Rabbit from '@/components/Rabbit/Rabbit';
import { nextSessionNumber } from '@/domain/foodProgress';
import type { ProgressByFood } from '@/domain/foodProgress';
import { loadTherapist, saveTherapist } from '@/storage/therapistStore';
import { collectsData } from '@/domain/sessionRecord';
import type { Difficulty } from '@/types';
import s from '@/app/styles/shared.module.scss';
import c from './SetupScreen.module.scss';

export interface StartParams {
  sessionNumber: number;
  foodId: string;
  difficulty: Difficulty;
  therapist: string;
}

const DIFFICULTIES: { id: Difficulty; label: string; hint: string }[] = [
  { id: 'facile', label: 'Facile', hint: 'tocchi liberi, con raccolta dati' },
  { id: 'difficile', label: 'Difficile', hint: 'tocchi a tempo, solo gioco' },
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
  const [therapist, setTherapist] = useState(loadTherapist);

  const query = foodQuery.trim().toLowerCase();
  const visibleFoods = query
    ? FOODS.filter((f) => f.label.toLowerCase().includes(query))
    : FOODS;

  const food = getFood(foodId);
  const progress = progressByFood[foodId];
  const sessionNumber = manualNumber ?? nextSessionNumber(progress);

  //Resetta sempre il numero del cibo
  const selectFood = (id: string) => {
    setFoodId(id);
    setManualNumber(null);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = therapist.trim();
    saveTherapist(name);
    onStart({ sessionNumber: Number(sessionNumber), foodId, difficulty, therapist: name });
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
          Terapista
          <input
            type="text"
            required
            placeholder="Chi conduce la sessione"
            value={therapist}
            onChange={(e) => setTherapist(e.target.value)}
          />
        </label>

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
                {d.label}
              </button>
            ))}
          </div>
          {!collectsData(difficulty) && (
            <p className={c.progressHint}>
              Solo gioco: la partita non viene salvata e non entra nei grafici.
            </p>
          )}
        </label>

        <button type="submit" className={`${s.btn} ${s.btnPrimary}`}>
          Inizia la storia
        </button>
        <button type="button" className={s.btn} onClick={onOpenDashboard}>
          Sessioni salvate
        </button>
        <button type="button" className={s.btn} onClick={onOpenSettings}>
          Impostazioni
        </button>
      </form>
    </div>
  );
};

export default SetupScreen;
