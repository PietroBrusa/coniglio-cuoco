import { describe, it, expect, vi, afterEach } from 'vitest';
import { downloadCsv, downloadJson } from './exportSession';
import type { Session } from '../types';

/**
 * COMPONENT test for the file-download side effects (Vitest browser mode).
 *
 * `downloadCsv`/`downloadJson` are the browser-dependent parts of the export
 * (the pure serialisation is unit-tested elsewhere). Here we verify the wiring
 * to the real browser APIs: a Blob URL is created, an anchor with the right
 * filename is clicked, and the object URL is revoked afterwards.
 */

const session = {
  childId: 'B001',
  sessionNumber: 2,
  food: 'Carota',
  foodId: 'carota',
  difficulty: 'facile',
  date: '2026-07-07T10:00:00.000Z',
  levels: [],
} as Session;

afterEach(() => vi.restoreAllMocks());

/** Spies on the download machinery and captures any created anchors. */
function spyDownload() {
  const anchors: HTMLAnchorElement[] = [];
  const realCreate = document.createElement.bind(document);
  vi.spyOn(document, 'createElement').mockImplementation((tag: string) => {
    const el = realCreate(tag);
    if (tag === 'a') anchors.push(el as HTMLAnchorElement);
    return el;
  });
  const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  const createUrl = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:fake');
  const revokeUrl = vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
  return { anchors, click, createUrl, revokeUrl };
}

describe('downloadCsv', () => {
  it('creates and clicks a .csv download, then revokes the URL', () => {
    const { anchors, click, createUrl, revokeUrl } = spyDownload();

    downloadCsv(session);

    expect(createUrl).toHaveBeenCalledTimes(1);
    expect(click).toHaveBeenCalledTimes(1);
    expect(anchors[0].download).toMatch(/\.csv$/);
    expect(revokeUrl).toHaveBeenCalledWith('blob:fake');
  });
});

describe('downloadJson', () => {
  it('creates and clicks a .json download', () => {
    const { anchors, click } = spyDownload();

    downloadJson(session);

    expect(click).toHaveBeenCalledTimes(1);
    expect(anchors[0].download).toMatch(/\.json$/);
  });
});
