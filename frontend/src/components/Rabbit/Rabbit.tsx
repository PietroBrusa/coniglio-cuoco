import type { RabbitMood } from '@/types';
import s from './Rabbit.module.scss';

const MESSAGES: Record<RabbitMood, string> = {
  idle: 'Pronti?',
  happy: 'Bravo!',
  sniff: 'Mmm, che profumo...',
  eat: 'Buonissimo!',
  cheer: 'Evviva!',
};

const LABELS: Record<RabbitMood, string> = {
  idle: 'Il coniglio aspetta',
  happy: 'Il coniglio è felice',
  sniff: 'Il coniglio annusa',
  eat: 'Il coniglio mangia',
  cheer: 'Il coniglio esulta',
};

const MOOD_CLASS: Record<RabbitMood, string> = {
  idle: '',
  happy: s.moodHappy,
  sniff: s.moodSniff,
  eat: s.moodEat,
  cheer: s.moodCheer,
};

const SPARKLE = 'M0-9Q1.6-1.6 9 0 1.6 1.6 0 9-1.6 1.6-9 0-1.6-1.6 0-9Z';
const SPARKLE_SPOTS = [
  { x: 30, y: 52 },
  { x: 170, y: 46 },
  { x: 20, y: 116 },
  { x: 180, y: 108 },
];

interface RabbitProps {
  mood?: RabbitMood;
  message?: string;
}

const Rabbit = ({ mood = 'idle', message }: RabbitProps) => {
  return (
    <div className={[s.rabbit, MOOD_CLASS[mood]].filter(Boolean).join(' ')}>
      {/* il viewBox lascia spazio sopra e sotto: il salto resta dentro al riquadro */}
      <svg className={s.rabbitFace} viewBox="0 -24 200 228" role="img" aria-label={LABELS[mood]}>
        <g className={s.sparkles}>
          {SPARKLE_SPOTS.map((spot) => (
            <path
              key={`${spot.x}-${spot.y}`}
              className={s.sparkle}
              d={SPARKLE}
              transform={`translate(${spot.x} ${spot.y})`}
            />
          ))}
        </g>

        <g className={s.hop}>
          <g transform="rotate(-11 85 84)">
            <g className={s.earL}>
              <ellipse className={s.fur} cx="78" cy="46" rx="16" ry="40" />
              <ellipse className={s.earInner} cx="78" cy="48" rx="8" ry="29" />
            </g>
          </g>
          <g transform="rotate(11 115 84)">
            <g className={s.earR}>
              <ellipse className={s.fur} cx="122" cy="46" rx="16" ry="40" />
              <ellipse className={s.earInner} cx="122" cy="48" rx="8" ry="29" />
            </g>
          </g>

          <g className={s.torso}>
            <ellipse className={s.fur} cx="100" cy="176" rx="48" ry="30" />
            <ellipse className={s.fur} cx="74" cy="192" rx="15" ry="11" />
            <ellipse className={s.fur} cx="126" cy="192" rx="15" ry="11" />
          </g>

          <g className={s.head}>
            <ellipse className={s.fur} cx="100" cy="112" rx="54" ry="47" />

            <g className={s.cheeks}>
              <circle className={s.cheek} cx="68" cy="130" r="10" />
              <circle className={s.cheek} cx="132" cy="130" r="10" />
            </g>

            <g className={s.whiskers}>
              <path className={s.whisker} d="M78 126 36 116" />
              <path className={s.whisker} d="M78 131 34 131" />
              <path className={s.whisker} d="M78 136 36 146" />
              <path className={s.whisker} d="M122 126 164 116" />
              <path className={s.whisker} d="M122 131 166 131" />
              <path className={s.whisker} d="M122 136 164 146" />
            </g>

            <g className={s.eyesOpen}>
              <ellipse className={s.eye} cx="82" cy="108" rx="7" ry="8.5" />
              <ellipse className={s.eye} cx="118" cy="108" rx="7" ry="8.5" />
              <circle className={s.eyeShine} cx="84.5" cy="104.5" r="2.6" />
              <circle className={s.eyeShine} cx="120.5" cy="104.5" r="2.6" />
            </g>
            <g className={s.eyesHappy}>
              <path className={s.happyEye} d="M74 111q8-11 16 0" />
              <path className={s.happyEye} d="M110 111q8-11 16 0" />
            </g>

            <g className={s.snout}>
              <path className={s.mouth} d="M93 138q-8 7-14-1" />
              <path className={s.mouth} d="M107 138q8 7 14-1" />
              <path
                className={s.nose}
                d="M100 129c-6 0-10-3-10-6s4.5-5 10-5 10 2 10 5-4 6-10 6z"
              />
              <rect className={s.teeth} x="93" y="130" width="14" height="13" rx="4.5" />
              <path className={s.toothLine} d="M100 131v11" />
            </g>
          </g>
        </g>
      </svg>
      <div className={s.rabbitBubble}>{message ?? MESSAGES[mood]}</div>
    </div>
  );
};

export default Rabbit;
