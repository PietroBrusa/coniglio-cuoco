/**
 * Colori delle serie del grafico ABA.
 *
 * Vivono in un file a sé perché li usano due generatori diversi — il grafico SVG
 * della dashboard e il grafico nativo del file Excel — e un livello deve avere
 * lo stesso colore in entrambi.
 *
 * @module
 */

/**
 * Un colore per livello: blu, arancione, magenta.
 *
 * Scelti per restare distinguibili anche stampati in scala di grigi (le tre
 * tinte hanno luminosità diverse) e ragionevolmente sicuri per le forme più
 * comuni di daltonismo.
 */
export const SERIES_COLORS = ['#1565c0', '#e65100', '#ad1457'];

/**
 * Colore associato a un livello.
 *
 * @param levelId - Numero del livello, a partire da 1.
 * @returns Il colore esadecimale; la palette si ripete ciclicamente se un giorno
 * i livelli diventassero più di tre.
 */
export const colorForLevel = (levelId: number): string =>
  SERIES_COLORS[(levelId - 1) % SERIES_COLORS.length];
