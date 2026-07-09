import { describe, it, expect, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useTouchTracker } from './useTouchTracker';
import type React from 'react';

/**
 * COMPONENT-level test of the measurement HOOK (Vitest browser mode).
 *
 * `useTouchTracker` is the clinical core: it turns raw pointer and Makey-Makey
 * (keyboard `Space`) events into `TouchRecord`s and live metrics. The pure maths
 * lives in `computeMetrics` (unit-tested separately); here we test the stateful
 * event handling in a real browser, where `performance.now()`, pointer and
 * keyboard events behave like production.
 */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A minimal stand-in for a React pointer event (only preventDefault is used). */
const pointerEvent = { preventDefault: () => {} } as unknown as React.PointerEvent;

/** Fires a Makey-Makey key (Space by default) on window. */
const key = (type: 'keydown' | 'keyup', code = 'Space', extra: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent(type, { code, ...extra }));

describe('useTouchTracker', () => {
  it('records a completed tap from a pointer down → up', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    result.current.pointerHandlers.onPointerDown(pointerEvent);
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));

    await sleep(30); // let the contact accrue a measurable duration
    result.current.pointerHandlers.onPointerUp();

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(1));
    const m = result.current.metrics;
    expect(result.current.isDown).toBe(false); // touch released
    expect(m.latencyMs).not.toBeNull();
    expect(m.totalContactMs).toBeGreaterThan(0);
  });

  it('records a tap from the Makey-Makey Space key', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    key('keydown');
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));
    await sleep(30);
    key('keyup');

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(1));
  });

  it('ignores keys other than Space (avoids false positives)', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    key('keydown', 'Enter');
    key('keyup', 'Enter');

    await sleep(50);
    expect(result.current.metrics.count).toBe(0);
    expect(result.current.isDown).toBe(false);
  });

  it('getResult closes an ongoing (still-pressed) touch, e.g. end of a hold level', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    result.current.pointerHandlers.onPointerDown(pointerEvent);
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));
    await sleep(40);

    // No pointer-up: the level completes while the food is still held.
    const frozen = result.current.getResult();
    expect(frozen.count).toBe(1); // the ongoing touch was counted
    expect(frozen.totalContactMs).toBeGreaterThan(0);
  });

  it('is completely idle when active is false', async () => {
    const { result } = await renderHook(() => useTouchTracker(false));

    result.current.pointerHandlers.onPointerDown(pointerEvent);
    key('keydown');
    key('keyup');
    result.current.pointerHandlers.onPointerUp();

    await sleep(50);
    expect(result.current.metrics.count).toBe(0);
    expect(result.current.isDown).toBe(false);
  });

  it('counts multiple sequential taps', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    for (let i = 0; i < 3; i += 1) {
      result.current.pointerHandlers.onPointerDown(pointerEvent);
      await sleep(15);
      result.current.pointerHandlers.onPointerUp();
      await sleep(15);
    }

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(3));
    // With 3 taps there are 2 inter-response gaps, so mean IRT is computable.
    expect(result.current.metrics.meanIrtMs).not.toBeNull();
  });
});
