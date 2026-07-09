import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import Sidebar from './Sidebar.svelte';
import { NAV_ITEMS } from '../../utils/routing.ts';

describe('Sidebar', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders nav items in prototype order', () => {
    render(Sidebar);

    const labels = NAV_ITEMS.map((item) => item.label);
    expect(labels).toEqual(['Home', 'Metrics', 'Projects', 'Blog', 'Contact', 'Privacy']);

    for (const label of labels) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument();
    }
  });

  it('marks the active section nav link', () => {
    const { container } = render(Sidebar, { props: { activeSection: 'projects' } });

    const active = container.querySelector('.navlink.active');
    expect(active).not.toBeNull();
    expect(active.textContent.trim()).toBe('Projects');
  });

  it('dispatches navigate with the section id on click', async () => {
    const { component } = render(Sidebar);
    const handler = vi.fn();
    component.$on('navigate', handler);

    await fireEvent.click(screen.getByRole('button', { name: 'Metrics' }));

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][0].detail).toBe('metrics');
  });

  it('shows identity, open-to-work badge, socials, and credit', () => {
    const { container } = render(Sidebar);

    expect(container.querySelector('[data-name="SidebarIdentity"]').textContent).toContain('James');
    expect(screen.getByText('OPEN TO WORK')).toBeInTheDocument();
    expect(screen.getByText('INSPIRED BY KEITA YAMADA')).toBeInTheDocument();

    const twitter = screen.getByRole('link', { name: 'Twitter' });
    expect(twitter).toHaveAttribute('href', 'https://x.com/V_like_flan');
    expect(twitter).toHaveAttribute('rel', expect.stringContaining('noopener'));
    expect(screen.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute(
      'href',
      'https://www.linkedin.com/in/james-vo/'
    );
  });

  it('includes a theme toggle that flips dark mode', async () => {
    const { container } = render(Sidebar);

    const toggle = container.querySelector('[data-name="theme-toggle"]');
    expect(toggle).not.toBeNull();

    const before = document.documentElement.getAttribute('data-light');
    await fireEvent.click(toggle);
    const after = document.documentElement.getAttribute('data-light');

    expect(after).not.toBe(before);

    // Restore for other tests sharing the document.
    await fireEvent.click(toggle);
  });
});
