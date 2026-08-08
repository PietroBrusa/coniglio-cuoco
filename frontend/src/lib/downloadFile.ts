/**
 * Consegna di un file al browser.
 *
 * @module
 */

/** Tipo MIME di un file .xlsx. */
export const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * Fa scaricare al browser i byte ricevuti, poi rilascia l'URL temporaneo.
 *
 * Il file non passa da nessun server: viene costruito nel browser e salvato dal
 * browser, quindi i dati del bambino non transitano in rete per essere esportati.
 *
 * @param data - Contenuto del file.
 * @param fileName - Nome proposto nella finestra di salvataggio.
 * @param type - Tipo MIME del contenuto.
 */
export function downloadFile(data: BlobPart, fileName: string, type: string): void {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
