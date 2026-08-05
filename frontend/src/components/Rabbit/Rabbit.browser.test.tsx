import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-react';
import Rabbit from './Rabbit';

describe('Rabbit', () => {
  it('renders the idle rabbit and default message by default', async () => {
    const screen = await render(<Rabbit />);
    await expect.element(screen.getByRole('img', { name: 'Il coniglio aspetta' })).toBeInTheDocument();
    await expect.element(screen.getByText('Pronti?')).toBeInTheDocument();
  });

  it('shows the mood-specific drawing and message', async () => {
    const screen = await render(<Rabbit mood="eat" />);
    await expect.element(screen.getByRole('img', { name: 'Il coniglio mangia' })).toBeInTheDocument();
    await expect.element(screen.getByText('Buonissimo!')).toBeInTheDocument();
  });

  it('lets a custom message override the default for the mood', async () => {
    const screen = await render(<Rabbit mood="happy" message="Perfetto!" />);
    await expect.element(screen.getByText('Perfetto!')).toBeInTheDocument();
    expect(screen.getByText('Bravo!').elements()).toHaveLength(0);
  });
});
