import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import SetupScreen from './SetupScreen';
import type { ProgressByFood } from '../utils/foodProgress';

function setup(props: { progressByFood?: ProgressByFood; progressLoading?: boolean } = {}) {
  const onStart = vi.fn();
  const onOpenDashboard = vi.fn();
  const onOpenSettings = vi.fn();
  const onLogout = vi.fn();
  const screen = render(
    <SetupScreen
      childId="B001"
      onStart={onStart}
      onOpenDashboard={onOpenDashboard}
      onOpenSettings={onOpenSettings}
      onLogout={onLogout}
      {...props}
    />,
  );
  return { screen, onStart, onOpenDashboard, onOpenSettings, onLogout };
}

const PROGRESS: ProgressByFood = {
  carota: { lastSessionNumber: 4, lastDate: '2026-03-12T10:00:00.000Z', total: 4 },
};

describe('SetupScreen', () => {
  it('shows the logged-in child', async () => {
    const { screen } = setup();
    await expect.element((await screen).getByText('B001')).toBeInTheDocument();
  });

  it('filters the food list as the therapist types', async () => {
    const { screen } = setup();
    const page = await screen;

    const search = page.getByPlaceholder('Cerca un alimento…');
    await search.fill('carota');

    await expect.element(page.getByRole('button', { name: /Carota/ })).toBeInTheDocument();
    expect(page.getByRole('button', { name: /Banana/ }).elements()).toHaveLength(0);
  });

  it('shows an empty state when nothing matches the search', async () => {
    const { screen } = setup();
    const page = await screen;
    await page.getByPlaceholder('Cerca un alimento…').fill('zzz-nope');
    await expect.element(page.getByText('Nessun alimento trovato.')).toBeInTheDocument();
  });

  it('emits the chosen parameters on submit', async () => {
    const { screen, onStart } = setup();
    const page = await screen;

    await page.getByPlaceholder('Cerca un alimento…').fill('carota');
    await page.getByRole('button', { name: /Carota/ }).click();
    await page.getByTitle('tocchi a tempo (piano tiles)').click();
    await page.getByRole('button', { name: /Inizia la storia/ }).click();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith({
      sessionNumber: 1,
      foodId: 'carota',
      difficulty: 'difficile',
    });
  });

  it('proposes the session after the last one reached with the chosen food', async () => {
    const { screen, onStart } = setup({ progressByFood: PROGRESS });
    const page = await screen;

    await page.getByPlaceholder('Cerca un alimento…').fill('carota');
    await page.getByRole('button', { name: /Carota/ }).click();

    await expect
      .element(page.getByText('Ultima con 🥕 Carota: n.4 del 12/03/2026'))
      .toBeInTheDocument();

    await page.getByRole('button', { name: /Inizia la storia/ }).click();
    expect(onStart).toHaveBeenCalledWith({
      sessionNumber: 5,
      foodId: 'carota',
      difficulty: 'facile',
    });
  });

  it('restarts from 1 on a food the child never worked on', async () => {
    const { screen, onStart } = setup({ progressByFood: PROGRESS });
    const page = await screen;

    await page.getByPlaceholder('Cerca un alimento…').fill('banana');
    await page.getByRole('button', { name: /Banana/ }).click();

    await expect.element(page.getByText('Prima sessione con 🍌 Banana')).toBeInTheDocument();

    await page.getByRole('button', { name: /Inizia la storia/ }).click();
    expect(onStart).toHaveBeenCalledWith({
      sessionNumber: 1,
      foodId: 'banana',
      difficulty: 'facile',
    });
  });

  it('lets the therapist override the proposed number', async () => {
    const { screen, onStart } = setup({ progressByFood: PROGRESS });
    const page = await screen;

    await page.getByPlaceholder('Cerca un alimento…').fill('carota');
    await page.getByRole('button', { name: /Carota/ }).click();
    await page.getByRole('spinbutton').fill('9');
    await page.getByRole('button', { name: /Inizia la storia/ }).click();

    expect(onStart).toHaveBeenCalledWith({
      sessionNumber: 9,
      foodId: 'carota',
      difficulty: 'facile',
    });
  });

  it('drops a manual override when another food is picked', async () => {
    const { screen, onStart } = setup({ progressByFood: PROGRESS });
    const page = await screen;

    await page.getByRole('spinbutton').fill('9');
    await page.getByPlaceholder('Cerca un alimento…').fill('carota');
    await page.getByRole('button', { name: /Carota/ }).click();
    await page.getByRole('button', { name: /Inizia la storia/ }).click();

    expect(onStart).toHaveBeenCalledWith({
      sessionNumber: 5,
      foodId: 'carota',
      difficulty: 'facile',
    });
  });

  it('does not claim a first session while the history is still loading', async () => {
    const { screen } = setup({ progressLoading: true });
    const page = await screen;
    await expect.element(page.getByText('Carico lo storico del bambino…')).toBeInTheDocument();
  });

  it('wires the secondary navigation buttons', async () => {
    const { screen, onOpenDashboard, onOpenSettings, onLogout } = setup();
    const page = await screen;

    await page.getByRole('button', { name: /Sessioni salvate/ }).click();
    expect(onOpenDashboard).toHaveBeenCalledTimes(1);

    await page.getByRole('button', { name: /Impostazioni/ }).click();
    expect(onOpenSettings).toHaveBeenCalledTimes(1);

    await page.getByRole('button', { name: 'cambia bambino' }).click();
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
