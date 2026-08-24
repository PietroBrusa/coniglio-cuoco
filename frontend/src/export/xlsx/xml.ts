export const XML_DECL = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>';

// eslint-disable-next-line no-control-regex -- intercettarli è esattamente lo scopo
const FORBIDDEN = /[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g;

export function esc(value: string): string {
  return value
    .replace(FORBIDDEN, '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
