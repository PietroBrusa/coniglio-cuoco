import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-react';
import AbaChart from './AbaChart';
import type { AbaSeries } from '../utils/abaData';

const point = (ordinal: number, value: number, sessionNumber = ordinal) => ({
  sessionNumber,
  ordinal,
  value,
  date: '2026-07-01T10:00:00.000Z',
  food: 'Mela',
});

const series: AbaSeries[] = [
  { levelId: 1, levelName: 'La Raccolta', points: [point(1, 20), point(2, 40), point(3, 60)] },
  { levelId: 2, levelName: "L'Annusata", points: [point(1, 10), point(2, 30), point(3, 50)] },
];

afterEach(() => cleanup());

describe('AbaChart', () => {
  it('draws one line per level', async () => {
    const screen = await render(<AbaChart series={series} phaseChanges={[]} criterion={40} />);

    expect(screen.container.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('labels every level in the legend, so colour is never the only cue', async () => {
    const screen = await render(<AbaChart series={series} phaseChanges={[]} criterion={40} />);

    await expect.element(screen.getByText(/Livello 1 · La Raccolta/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 2 · L'Annusata/)).toBeInTheDocument();
  });

  it('draws and labels the criterion line', async () => {
    const screen = await render(<AbaChart series={series} phaseChanges={[]} criterion={65} />);

    await expect.element(screen.getByText('criterio 65%')).toBeInTheDocument();
  });

  it('draws a phase-change line with its condition', async () => {
    const screen = await render(
      <AbaChart
        series={series}
        phaseChanges={[{ atSessionNumber: 2, atOrdinal: 2, condition: 'Mela · difficile' }]}
        criterion={40}
      />,
    );

    await expect.element(screen.getByText('Mela · difficile')).toBeInTheDocument();
  });

  it('skips a phase-change line at the very first session', async () => {
    const screen = await render(
      <AbaChart
        series={series}
        phaseChanges={[{ atSessionNumber: 1, atOrdinal: 1, condition: 'Mela · facile' }]}
        criterion={40}
      />,
    );

    expect(screen.container.querySelectorAll('text')).not.toContain('Mela · facile');
  });

  it('renders a message rather than an empty plot when there is no data', async () => {
    const screen = await render(<AbaChart series={[]} phaseChanges={[]} criterion={40} />);

    await expect.element(screen.getByText(/Nessun dato/)).toBeInTheDocument();
  });

  it('describes each point for assistive technology and hover', async () => {
    const screen = await render(<AbaChart series={series} phaseChanges={[]} criterion={40} />);

    const titles = [...screen.container.querySelectorAll('circle title')].map((t) => t.textContent);
    expect(titles).toContain('La Raccolta · sessione 2: 40.0%');
  });

  it("counts this food's own sessions, whatever the session numbers were", async () => {
    const spaced: AbaSeries[] = [
      {
        levelId: 1,
        levelName: 'La Raccolta',
        points: [point(1, 20, 4), point(2, 40, 7), point(3, 60, 11)],
      },
    ];
    const screen = await render(<AbaChart series={spaced} phaseChanges={[]} criterion={40} />);

    const labels = [...screen.container.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels).toContain('1');
    expect(labels).toContain('3');
    expect(labels).not.toContain('11');

    const titles = [...screen.container.querySelectorAll('circle title')].map((t) => t.textContent);
    expect(titles).toContain('La Raccolta · sessione 2: 40.0%');
  });

  it('plots a single session without collapsing the scale', async () => {
    const single: AbaSeries[] = [{ levelId: 1, levelName: 'La Raccolta', points: [point(1, 50)] }];
    const screen = await render(<AbaChart series={single} phaseChanges={[]} criterion={40} />);

    expect(screen.container.querySelectorAll('polyline')).toHaveLength(1);
    await expect.element(screen.getByText('criterio 40%')).toBeInTheDocument();
  });
});
