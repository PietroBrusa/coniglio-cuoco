/**
 * Series colours for the progress chart, one per level, in fixed order — level 1
 * always gets the first colour whether or not the other levels are present, so a
 * chart with fewer lines never repaints the surviving ones.
 *
 * Validated for colour-vision deficiency across *all* pairs, not just adjacent
 * ones (worst pair ΔE 14.0 on tritanopia, against a threshold of 8), because all
 * three lines are on screen at the same time.
 */
export const SERIES_COLORS = ['#1565c0', '#e65100', '#ad1457'];

/** Wraps around if a fourth level is ever added. */
export const colorForLevel = (levelId: number): string =>
  SERIES_COLORS[(levelId - 1) % SERIES_COLORS.length];
