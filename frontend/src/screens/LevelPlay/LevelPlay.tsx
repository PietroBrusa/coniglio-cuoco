import { useEffect, useRef, useState } from 'react';
import Rabbit from '@/components/Rabbit/Rabbit';
import { useTouchTracker } from '@/hooks/useTouchTracker';
import { useMakeyKey } from '@/hooks/useMakeyKey';
import { useHardBeat } from '@/hooks/useHardBeat';
import type { Difficulty, Food, Level, Metrics, RabbitMood } from '@/types';
import s from '@/app/styles/shared.module.scss';
import c from './LevelPlay.module.scss';

/**
 * Tocchi richiesti per passare dall'introduzione al gioco.
 *
 * Servono a tre cose: verificare che il circuito funzioni prima di iniziare a
 * misurare, dare al bambino un contatto non valutato che riduce la reattività al
 * compito, e far partire la misura quando il bambino è pronto invece che quando
 * l'operatore preme un pulsante — il che toglierebbe di mezzo una fonte di
 * variabilità.
 */
const STARTER_TAPS = 3;

/** Espressione del coniglio mentre il contatto è in corso, livello per livello. */
const ACTIVE_MOOD: Record<number, RabbitMood> = { 1: 'happy', 2: 'sniff', 3: 'eat' };

/** Che cosa serve alla schermata di gioco per condurre un livello. */
interface LevelPlayProps {
  /** Livello da eseguire. */
  level: Level;
  /** Alimento con cui si lavora. */
  food: Food;
  /** Condizione della sessione: cambia la meccanica del livello. */
  difficulty: Difficulty;
  /**
   * Richiamata allo scadere della finestra, con le misurazioni definitive e le
   * finestre centrate in modalità difficile (`null` in facile, dove il ritmo non
   * viene proposto).
   */
  onComplete: (result: Metrics, beatsScored: number | null) => void;
}

/**
 * Schermata di gioco: conduce un livello dall'introduzione alla fine della
 * misurazione.
 *
 * Si svolge in due fasi. Nell'**introduzione** viene raccontata la storia e si
 * attendono i tocchi di avvio; la misurazione è ferma. Nel **gioco** il
 * registratore dei contatti si attiva, ma la finestra di misura parte solo al
 * primo contatto: il tempo che il bambino impiega ad avvicinarsi non consuma la
 * finestra e viene registrato a parte come latenza. Così tutti hanno la stessa
 * opportunità effettiva e le percentuali restano confrontabili fra sessioni.
 *
 * In modalità difficile gira in parallelo il ciclo delle finestre utili, condotto
 * da {@link hooks/useHardBeat}: lì cambia anche il significato della barra di
 * avanzamento, che conta le finestre centrate invece dei secondi di contatto. La
 * misura del tempo continua comunque a girare, ma serve solo a chiudere il
 * livello allo scadere della finestra, non a valutarlo.
 */
const LevelPlay = ({ level, food, difficulty, onComplete }: LevelPlayProps) => {
  const isHard = difficulty === 'difficile';

  const windowMs = level.target * 1000;
  const beat = level.hardBeat;

  const [starterTaps, setStarterTaps] = useState(0);
  const phase: 'intro' | 'play' = starterTaps >= STARTER_TAPS ? 'play' : 'intro';
  const completedRef = useRef(false);

  const { metrics, isDown, hasStarted, getResult } = useTouchTracker(phase === 'play');
  const rhythm = useHardBeat(beat, isHard && phase === 'play');

  const onCompleteRef = useRef(onComplete);
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useMakeyKey(phase === 'intro', {
    onPress: () => setStarterTaps((prev) => prev + 1),
  });

  const { getScored } = rhythm;

  useEffect(() => {
    if (phase !== 'play' || !hasStarted || completedRef.current) return undefined;

    const id = window.setTimeout(() => {
      if (completedRef.current) return;
      completedRef.current = true;
      onCompleteRef.current(getResult(windowMs), isHard ? getScored() : null);
    }, windowMs);

    return () => window.clearTimeout(id);
  }, [phase, hasStarted, windowMs, getResult, isHard, getScored]);

  const contactSeconds = metrics.liveContactMs / 1000;

  // In difficile l'obiettivo del livello sono le finestre centrate, non i secondi
  // di contatto: la barra deve misurare quello che il gioco chiede davvero.
  const progressPct = isHard
    ? Math.min(100, (rhythm.scored / beat.beatTarget) * 100)
    : Math.min(100, (contactSeconds / level.target) * 100);
  const progressText = isHard
    ? `🎵 Ritmo ${Math.min(rhythm.scored, beat.beatTarget)}/${beat.beatTarget}`
    : level.progressLabel(contactSeconds, level.target);
  const remainingSeconds = hasStarted
    ? Math.max(0, (windowMs - metrics.sessionDurationMs) / 1000)
    : level.target;

  const mood: RabbitMood =
    phase === 'intro' ? 'happy' : isDown ? ACTIVE_MOOD[level.id] ?? 'happy' : 'idle';

  const foodClass = [
    c.foodTarget,
    isDown ? c.foodTargetTouched : '',
    isHard && phase === 'play' && rhythm.windowOpen ? c.foodTargetActive : '',
    isHard && phase === 'play' && !rhythm.windowOpen ? c.foodTargetDim : '',
    rhythm.miss ? c.foodTargetMiss : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={s.screen}>
      <div className={c.levelTag}>
        Livello {level.id} · {level.name}
        {isHard && <span className={c.diffBadge}>🎵 Difficile</span>}
      </div>

      <Rabbit mood={mood} />

      {phase === 'intro' ? (
        <div className={`${s.card} ${c.introCard}`}>
          <p className={c.introText}>{level.intro({ foodLabel: food.label })}</p>
          {isHard && (
            <p className={c.starterHint}>
              {beat.score === 'hold'
                ? `Modalità a tempo: quando ${food.label.toLowerCase()} si illumina tocca subito e ` +
                  `tieni premuto finché resta accesa! Ogni volta l'attesa e la durata cambiano. 🎵`
                : `Modalità a tempo: tocca ${food.label.toLowerCase()} solo quando si illumina! 🎵`}
            </p>
          )}
          <p className={c.starterHint}>
            Tocca {food.label.toLowerCase()} {STARTER_TAPS} volte per iniziare!
          </p>
          <div className={c.starterDots}>
            {Array.from({ length: STARTER_TAPS }).map((_, i) => (
              <span key={i} className={`${c.dot} ${i < starterTaps ? c.dotOn : ''}`} />
            ))}
          </div>
        </div>
      ) : (
        <div className={c.progressWrap}>
          <div className={c.progressLabel}>{progressText}</div>
          <div className={c.progressBar}>
            <div className={c.progressBarFill} style={{ width: `${progressPct}%` }} />
          </div>
          <div className={c.liveMetrics}>
            <span>👆 {metrics.count}</span>
            <span>⏱ {contactSeconds.toFixed(1)}s</span>
            <span>⏳ {remainingSeconds.toFixed(1)}s</span>
          </div>
        </div>
      )}

      {/* Solo visualizzazione: il contatto si legge dal Makey Makey (Space) su
          `window`, mai da questo elemento. Se contasse il tocco sullo schermo il
          bambino potrebbe completare il livello senza toccare l'alimento, e il
          dato non misurerebbe più il comportamento target. Vedi useMakeyKey. */}
      <button type="button" className={foodClass} aria-label={`Tocca ${food.label}`}>
        <span className={c.foodTargetEmoji}>{food.emoji}</span>
      </button>

      <p className={c.hint}>
        {phase !== 'play'
          ? ''
          : isHard
            ? !rhythm.windowOpen
              ? 'Aspetta che si illumini…'
              : beat.score === 'hold'
                ? '🎵 Tieni premuto!'
                : '🎵 Tocca ora!'
            : !hasStarted
              ? 'Tocca il cibo: il tempo parte da lì!'
              : level.hint}
      </p>
    </div>
  );
};

export default LevelPlay;
