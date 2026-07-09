import { describe, it, expect, vi } from 'vitest';
import { render } from 'vitest-browser-react';
import SetupScreen from './SetupScreen';

/**
 * COMPONENT test for the setup screen (Vitest browser mode, real Chromium).
 *
 * SetupScreen is a self-contained form: it takes the logged-in child and a set
 * of callbacks, and emits the chosen session parameters via `onStart`. We test
 * its contract and interactions the way a therapist would use it:
 *   - the child id is displayed;
 *   - the food search filters the pickable items (incl. the empty state);
 *   - selecting a food + difficulty and submitting emits the right parameters;
 *   - the secondary buttons trigger their callbacks.
 */

/** Renders SetupScreen with spy callbacks; returns the screen and the spies. */
function setup() {
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
    />,
  );
  return { screen, onStart, onOpenDashboard, onOpenSettings, onLogout };
}

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

    // Only the matching food remains selectable.
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
    // The difficulty chips carry a unique tooltip; use it to disambiguate.
    await page.getByTitle('tocchi a tempo (piano tiles)').click();
    await page.getByRole('button', { name: /Inizia la storia/ }).click();

    expect(onStart).toHaveBeenCalledTimes(1);
    expect(onStart).toHaveBeenCalledWith({
      sessionNumber: 1,
      foodId: 'carota',
      difficulty: 'difficile',
    });
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
