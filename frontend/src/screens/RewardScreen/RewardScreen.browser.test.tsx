import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from 'vitest-browser-react';
import RewardScreen from './RewardScreen';
import type { Level, Metrics } from '@/types';

const level = { id: 2, mode: 'hold', name: "L'Annusata" } as Level;

const threeStarMetrics = {
  count: 5,
  latencyMs: 0,
  totalContactMs: 3000,
  liveContactMs: 3000,
  meanTouchMs: 600,
  meanIrtMs: 200,
  sessionDurationMs: 5000,
  engagementRatio: 100,
  touches: [],
} as Metrics;

beforeEach(() => {
  localStorage.setItem('coniglio-cuoco:settings', JSON.stringify({ soundEnabled: false }));
});

describe('RewardScreen', () => {
  it('renders the rabbit, the level title and the computed stars', async () => {
    const screen = await render(
      <RewardScreen
        level={level}
        metrics={threeStarMetrics}
        difficulty="facile"
        isLastLevel={false}
        onNext={vi.fn()}
        onRepeat={vi.fn()}
      />,
    );

    await expect.element(screen.getByText('Livello 2 completato!')).toBeInTheDocument();
    await expect.element(screen.getByText('Bravissimo!')).toBeInTheDocument();
    await expect.element(screen.getByLabelText('3 stelle su 3')).toBeInTheDocument();
  });

  it('awards fewer stars when the metrics are weaker', async () => {
    const weak = { ...threeStarMetrics, latencyMs: 99999, engagementRatio: 0 } as Metrics;
    const screen = await render(
      <RewardScreen
        level={level}
        metrics={weak}
        difficulty="facile"
        isLastLevel={false}
        onNext={vi.fn()}
        onRepeat={vi.fn()}
      />,
    );
    await expect.element(screen.getByLabelText('1 stelle su 3')).toBeInTheDocument();
  });

  it('fires onRepeat and onNext when the buttons are clicked', async () => {
    const onNext = vi.fn();
    const onRepeat = vi.fn();
    const screen = await render(
      <RewardScreen
        level={level}
        metrics={threeStarMetrics}
        difficulty="facile"
        isLastLevel={false}
        onNext={onNext}
        onRepeat={onRepeat}
      />,
    );

    await screen.getByRole('button', { name: /Ripeti livello/ }).click();
    expect(onRepeat).toHaveBeenCalledTimes(1);

    await screen.getByRole('button', { name: /Prossimo livello/ }).click();
    expect(onNext).toHaveBeenCalledTimes(1);
  });

  it('labels the advance button differently on the last level', async () => {
    const screen = await render(
      <RewardScreen
        level={level}
        metrics={threeStarMetrics}
        difficulty="facile"
        isLastLevel={true}
        onNext={vi.fn()}
        onRepeat={vi.fn()}
      />,
    );
    await expect
      .element(screen.getByRole('button', { name: /Fine sessione/ }))
      .toBeInTheDocument();
  });
});
