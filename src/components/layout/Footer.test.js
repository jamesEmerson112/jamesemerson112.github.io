import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import Footer from './Footer.svelte';

describe('Footer', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders copyright and credit lines', () => {
    render(Footer);

    expect(screen.getByText('© 2026 JAMES EMERSON VO')).toBeInTheDocument();
    expect(screen.getByText('INSPIRED BY KEITA YAMADA')).toBeInTheDocument();
  });
});
