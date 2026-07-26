export const SERIES_COLORS = ['#1565c0', '#e65100', '#ad1457'];

export const colorForLevel = (levelId: number): string =>
  SERIES_COLORS[(levelId - 1) % SERIES_COLORS.length];
