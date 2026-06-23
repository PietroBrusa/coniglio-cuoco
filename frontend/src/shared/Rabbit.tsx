import type { RabbitMood } from '../types';
import s from './Rabbit.module.scss';

const FACES: Record<RabbitMood, string> = {
  idle: '🐰',
  happy: '😊',
  sniff: '😌',
  eat: '😋',
  cheer: '🤩',
};

const MESSAGES: Record<RabbitMood, string> = {
  idle: 'Pronti?',
  happy: 'Bravo!',
  sniff: 'Mmm, che profumo...',
  eat: 'Buonissimo!',
  cheer: 'Evviva!',
};

const MOOD_CLASS: Record<RabbitMood, string> = {
  idle: '',
  happy: s.moodHappy,
  sniff: '',
  eat: s.moodEat,
  cheer: s.moodCheer,
};

interface RabbitProps {
  /** Determines the displayed emoji, speech-bubble text and CSS animation. Defaults to `'idle'`. */
  mood?: RabbitMood;
  /** Overrides the default speech-bubble message for the given mood. */
  message?: string;
}

/**
 * Rabbit avatar: shows an emoji, a speech bubble and a CSS animation based on
 * the current `mood`. Pure presentational component with no internal state.
 */
const Rabbit = ({ mood = 'idle', message }: RabbitProps) => {
  return (
    <div className={`${s.rabbit} ${MOOD_CLASS[mood]}`}>
      <div className={s.rabbitFace}>{FACES[mood]}</div>
      <div className={s.rabbitBubble}>{message ?? MESSAGES[mood]}</div>
    </div>
  );
};

export default Rabbit;
