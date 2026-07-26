import { describe, it, expect, vi } from 'vitest';
import { renderHook } from 'vitest-browser-react';
import { useTouchTracker } from './useTouchTracker';
import type React from 'react';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const pointerEvent = (pointerId = 1) =>
  ({ pointerId, preventDefault: () => {} }) as unknown as React.PointerEvent;

const key = (type: 'keydown' | 'keyup', code = 'Space', extra: KeyboardEventInit = {}) =>
  window.dispatchEvent(new KeyboardEvent(type, { code, ...extra }));

describe('useTouchTracker', () => {
  it('records a completed tap from a pointer down → up', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    result.current.pointerHandlers.onPointerDown(pointerEvent());
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));

    await sleep(30);
    result.current.pointerHandlers.onPointerUp(pointerEvent());

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(1));
    const m = result.current.metrics;
    expect(result.current.isDown).toBe(false);
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

  it('keeps the window shut until the first contact', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    await sleep(50);
    expect(result.current.hasStarted).toBe(false);
    expect(result.current.metrics.sessionDurationMs).toBe(0);

    result.current.pointerHandlers.onPointerDown(pointerEvent());

    await vi.waitFor(() => expect(result.current.hasStarted).toBe(true));
  });

  it('measures the latency from the level becoming playable to that contact', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    await sleep(80);
    result.current.pointerHandlers.onPointerDown(pointerEvent());

    await vi.waitFor(() => expect(result.current.metrics.latencyMs).not.toBeNull());
    expect(result.current.metrics.latencyMs).toBeGreaterThan(50);
  });

  it('clips a touch still held when the window closes', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    result.current.pointerHandlers.onPointerDown(pointerEvent());
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));
    await sleep(120);

    const frozen = result.current.getResult(50);

    expect(frozen.sessionDurationMs).toBe(50);
    expect(frozen.totalContactMs).toBeLessThanOrEqual(50);
    expect(frozen.engagementRatio).toBeLessThanOrEqual(100);
  });

  it('getResult closes an ongoing (still-pressed) touch, e.g. end of a hold level', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    result.current.pointerHandlers.onPointerDown(pointerEvent());
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));
    await sleep(40);

    const frozen = result.current.getResult();
    expect(frozen.count).toBe(1);
    expect(frozen.totalContactMs).toBeGreaterThan(0);
  });

  it('is completely idle when active is false', async () => {
    const { result } = await renderHook(() => useTouchTracker(false));

    result.current.pointerHandlers.onPointerDown(pointerEvent());
    key('keydown');
    key('keyup');
    result.current.pointerHandlers.onPointerUp(pointerEvent());

    await sleep(50);
    expect(result.current.metrics.count).toBe(0);
    expect(result.current.isDown).toBe(false);
  });

  it('ignores a pointerleave from a pointer that did not start the contact', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    result.current.pointerHandlers.onPointerDown(pointerEvent(1));
    await vi.waitFor(() => expect(result.current.isDown).toBe(true));

    // The target shrinks on press (scale .92); a stale cursor crossing its edge
    // must not truncate the contact opened by another pointer.
    result.current.pointerHandlers.onPointerLeave(pointerEvent(2));
    await sleep(30);

    expect(result.current.isDown).toBe(true);
    expect(result.current.metrics.count).toBe(0);

    result.current.pointerHandlers.onPointerUp(pointerEvent(1));
    await vi.waitFor(() => expect(result.current.metrics.count).toBe(1));
    expect(result.current.metrics.totalContactMs).toBeGreaterThan(20);
  });

  it('counts multiple sequential taps', async () => {
    const { result } = await renderHook(() => useTouchTracker(true));

    for (let i = 0; i < 3; i += 1) {
      result.current.pointerHandlers.onPointerDown(pointerEvent());
      await sleep(15);
      result.current.pointerHandlers.onPointerUp(pointerEvent());
      await sleep(15);
    }

    await vi.waitFor(() => expect(result.current.metrics.count).toBe(3));
    expect(result.current.metrics.meanIrtMs).not.toBeNull();
  });
});
