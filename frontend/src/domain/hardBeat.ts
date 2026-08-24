export const HOLD_EARLY_MS = 150;

export const HOLD_GRACE_MS = 400;

export function sampleBeatMs([min, max]: [number, number], rand: () => number = Math.random): number {
  return min + rand() * (max - min);
}

export function isHeldThrough(openedAt: number, pressStart: number | null): boolean {
  if (pressStart === null) return false;
  return pressStart >= openedAt - HOLD_EARLY_MS && pressStart <= openedAt + HOLD_GRACE_MS;
}
