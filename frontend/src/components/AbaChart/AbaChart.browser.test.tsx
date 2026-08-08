import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-react';
import AbaChart from './AbaChart';
import type { AbaSeries } from '@/export/abaData';

const point = (ordinal: number, value: number) => ({ ordinal, value });

const series: AbaSeries[] = [
  { levelId: 1, levelName: 'La Raccolta', points: [point(1, 20), point(2, 40), point(3, 60)] },
  { levelId: 2, levelName: "L'Annusata", points: [point(1, 10), point(2, 30), point(3, 50)] },
];

afterEach(() => cleanup());

describe('AbaChart', () => {
  it('draws one line per level', async () => {
    const screen = await render(<AbaChart series={series} criterion={40} />);

    expect(screen.container.querySelectorAll('polyline')).toHaveLength(2);
  });

  it('labels every level in the legend, so colour is never the only cue', async () => {
    const screen = await render(<AbaChart series={series} criterion={40} />);

    await expect.element(screen.getByText(/Livello 1 · La Raccolta/)).toBeInTheDocument();
    await expect.element(screen.getByText(/Livello 2 · L'Annusata/)).toBeInTheDocument();
  });

  it('draws and labels the criterion line', async () => {
    const screen = await render(<AbaChart series={series} criterion={65} />);

    await expect.element(screen.getByText('criterio 65%')).toBeInTheDocument();
  });

  it('renders a message rather than an empty plot when there is no data', async () => {
    const screen = await render(<AbaChart series={[]} criterion={40} />);

    await expect.element(screen.getByText(/Nessun dato/)).toBeInTheDocument();
  });

  it('describes each point for assistive technology and hover', async () => {
    const screen = await render(<AbaChart series={series} criterion={40} />);

    const titles = [...screen.container.querySelectorAll('circle title')].map((t) => t.textContent);
    expect(titles).toContain('La Raccolta · sessione 2: 40.0%');
  });

  it('labels the horizontal axis with the dense progressive it receives', async () => {
    const screen = await render(<AbaChart series={series} criterion={40} />);

    const labels = [...screen.container.querySelectorAll('text')].map((t) => t.textContent);
    expect(labels).toContain('1');
    expect(labels).toContain('3');
  });

  it('plots a single session without collapsing the scale', async () => {
    const single: AbaSeries[] = [{ levelId: 1, levelName: 'La Raccolta', points: [point(1, 50)] }];
    const screen = await render(<AbaChart series={single} criterion={40} />);

    expect(screen.container.querySelectorAll('polyline')).toHaveLength(1);
    await expect.element(screen.getByText('criterio 40%')).toBeInTheDocument();
  });
});
