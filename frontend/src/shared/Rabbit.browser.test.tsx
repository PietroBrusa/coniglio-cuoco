import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import Rabbit from './Rabbit';

/**
 * COMPONENT test — runs in a real Chromium browser (Vitest browser mode).
 *
 * Rabbit is a pure presentational component: given a `mood` (and optional
 * `message`) it renders an emoji face and a speech bubble. We test its
 * *contract* — the inputs (props) and the resulting rendered DOM — the way a
 * user would see it, rather than any internal implementation detail.
 */
describe('Rabbit', () => {
  it('renders the idle face and default message by default', async () => {
    const screen = await render(<Rabbit />);
    await expect.element(screen.getByText('🐰')).toBeInTheDocument();
    await expect.element(screen.getByText('Pronti?')).toBeInTheDocument();
  });

  it('shows the mood-specific face and message', async () => {
    const screen = await render(<Rabbit mood="eat" />);
    await expect.element(screen.getByText('😋')).toBeInTheDocument();
    await expect.element(screen.getByText('Buonissimo!')).toBeInTheDocument();
  });

  it('lets a custom message override the default for the mood', async () => {
    const screen = await render(<Rabbit mood="happy" message="Perfetto!" />);
    await expect.element(screen.getByText('Perfetto!')).toBeInTheDocument();
    // The default "Bravo!" message for the happy mood must not be shown.
    expect(screen.getByText('Bravo!').elements()).toHaveLength(0);
  });
});
