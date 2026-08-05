import { describe, it, expect, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useTouchTracker } from './useTouchTracker';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const key = (type: 'keydown' | 'keyup', code = 'Space', extra: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent(type, { code, ...extra }));

const press = () => key('keydown');
const release = () => key('keyup');

describe('useTouchTracker', () => {
  it('records a completed contact from the Makey-Makey Space key', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    press();
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));

    await sleep(30);
    release();

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(1));
    const m = result.current.metrics;
    expect(result.current.isDown).toBe(false);
    expect(m.latencyMs).not.toBeNull();
    expect(m.totalContactMs).toBeGreaterThan(0);
  });

  it('ignores keys other than Space (avoids false positives)', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    key('keydown', 'Enter');
    key('keyup', 'Enter');

    await sleep(50);
    expect(result.current.metrics.count).toBe(0);
    expect(result.current.isDown).toBe(false);
  });

  it('ignores the auto-repeat of a held key, keeping the hold as one contact', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    press();
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));

    // The OS repeats keydown while the circuit stays closed; each repeat must
    // not split one long hold into a burst of separate taps.
    for (let i = 0; i < 5; i += 1) {
      key('keydown', 'Space', { repeat: true });
      await sleep(10);
    }
    expect(result.current.metrics.count).toBe(0);
    expect(result.current.isDown).toBe(true);

    release();

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(1));
    expect(result.current.metrics.totalContactMs).toBeGreaterThan(40);
  });

  it('keeps the window shut until the first contact', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    await sleep(50);
    expect(result.current.hasStarted).toBe(false);
    expect(result.current.metrics.sessionDurationMs).toBe(0);

    press();

    await vi.waitFor(() => expect(result.current.hasStarted).toBe(true));
  });

  it('measures the latency from the level becoming playable to that contact', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    await sleep(80);
    press();

    await vi.waitFor(() => expect(result.current.metrics.latencyMs).not.toBeNull());
    expect(result.current.metrics.latencyMs).toBeGreaterThan(50);
  });

  it('clips a touch still held when the window closes', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    press();
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));
    await sleep(120);

    const frozen = result.current.getResult(50);

    expect(frozen.sessionDurationMs).toBe(50);
    expect(frozen.totalContactMs).toBeLessThanOrEqual(50);
    expect(frozen.engagementRatio).toBeLessThanOrEqual(100);
  });

  it('getResult closes an ongoing (still-pressed) touch, e.g. end of a hold level', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    press();
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));
    await sleep(40);

    const frozen = result.current.getResult();
    expect(frozen.count).toBe(1);
    expect(frozen.totalContactMs).toBeGreaterThan(0);
  });

  it('is completely idle when active is false', async () => {
    const { result } = await renderHook(() => useTouchTracker(false));

    press();
    release();

    await sleep(50);
    expect(result.current.metrics.count).toBe(0);
    expect(result.current.isDown).toBe(false);
  });

  it('counts multiple sequential taps', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    for (let i = 0; i < 3; i += 1) {
      press();
      await sleep(15);
      release();
      await sleep(15);
    }

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(3));
    expect(result.current.metrics.meanIrtMs).not.toBeNull();
  });
});
