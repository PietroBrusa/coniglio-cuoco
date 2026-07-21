import { describe, it, expect, afterEach } from 'vitest';
import { render, cleanup } from 'vitest-browser-react';
import IntervalGrid from './IntervalGrid';
import { wholeIntervalRecording } from '../utils/abaData';

/**
 * COMPONENT tests for the whole-interval recording grid, in a real browser.
 * The grid stands in for a paper data sheet, so what is checked is that each
 * interval shows a readable `+`/`−` glyph — not a colour — and that the percent
 * of occurrence matches the scored record.
 */

afterEach(() => cleanup());

/** Contact from `down` to `up`, in ms from the start of the window. */
const contact = (down: number, up: number) => ({ down, up, duration: up - down });

/** The six-second window every level now measures over. */
const WINDOW_MS = 6000;

describe('IntervalGrid', () => {
  it('renders one cell per second of the window, plus the percentage', async () => {
    const record = wholeIntervalRecording([contact(0, 3000)], WINDOW_MS);
    const screen = await render(<IntervalGrid record={record} caption="Livello 1" />);

    const cells = screen.container.querySelectorAll('tbody td');
    expect(cells).toHaveLength(7); // 6 seconds + the percent column
  });

  it('marks covered seconds with "+" and the rest with "−"', async () => {
    // Contact for the first half of the window: three `+` then three `−`.
    const record = wholeIntervalRecording([contact(0, 3000)], WINDOW_MS);
    const screen = await render(<IntervalGrid record={record} caption="Livello 1" />);

    const marks = [...screen.container.querySelectorAll('tbody td')]
      .slice(0, 6)
      .map((td) => td.textContent);
    expect(marks).toEqual(['+', '+', '+', '−', '−', '−']);
  });

  it('shows the percent of occurrence', async () => {
    const record = wholeIntervalRecording([contact(0, 3000)], WINDOW_MS);
    const screen = await render(<IntervalGrid record={record} caption="Livello 1" />);

    await expect.element(screen.getByText('50%')).toBeInTheDocument();
  });

  it('states the interval length in the caption', async () => {
    const record = wholeIntervalRecording([], WINDOW_MS);
    const screen = await render(<IntervalGrid record={record} caption="Livello 2" />);

    await expect.element(screen.getByText(/Livello 2 — intervalli da 1.0 s/)).toBeInTheDocument();
  });

  it('numbers the columns by second', async () => {
    const record = wholeIntervalRecording([], WINDOW_MS);
    const screen = await render(<IntervalGrid record={record} caption="Livello 1" />);

    const headers = [...screen.container.querySelectorAll('thead th')].map((th) => th.textContent);
    expect(headers).toEqual(['Secondo', '1', '2', '3', '4', '5', '6', '%']);
  });

  it('renders an all-"−" grid for a level with no contact', async () => {
    const record = wholeIntervalRecording([], WINDOW_MS);
    const screen = await render(<IntervalGrid record={record} caption="Livello 3" />);

    const cells = [...screen.container.querySelectorAll('tbody td')].map((td) => td.textContent);
    expect(cells.slice(0, 6)).toEqual(Array(6).fill('−'));
    expect(cells[6]).toBe('0%');
  });
});
