/** Minimal XML helpers shared by every part of the workbook we write by hand. */

export const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

/** Characters XML 1.0 forbids outright; therapist notes are free text, so we drop them. */
// eslint-disable-next-line no-control-regex -- matching them is the whole point
const FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

/** Escapes text for use both in element content and in double-quoted attributes. */
export function esc(value: string): string {
  return value
    .replace(FORBIDDEN, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
