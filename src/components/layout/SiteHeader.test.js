import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import SiteHeader from './SiteHeader.svelte';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('SiteHeader', () => {
  it('applies prop-driven blend mode on the header shell', () => {
    const { container } = render(SiteHeader, {
      props: {
        activeSection: 'home',
        compact: false,
        blendMode: 'normal'
      }
    });

    const header = container.querySelector('.siteHeader');
    expect(header).toBeInTheDocument();
    expect(header).toHaveAttribute('style', expect.stringContaining('mix-blend-mode: normal'));
  });

  it('shows visible identity block in non-compact mode', () => {
    const { container } = render(SiteHeader, {
      props: {
        activeSection: 'home',
        compact: false
      }
    });

    const identity = container.querySelector('.siteHeader_identity');
    const description = container.querySelector('.siteHeader_description');
    expect(identity).toBeInTheDocument();
    expect(identity).not.toHaveClass('is-hidden');
    expect(identity).toHaveAttribute('aria-hidden', 'false');
    expect(description).toBeInTheDocument();
    expect(description).not.toHaveClass('is-hidden');
    expect(description).toHaveAttribute('aria-hidden', 'false');
    expect(screen.getByText('James')).toBeInTheDocument();
    expect(screen.getByText('Emerson')).toBeInTheDocument();
    expect(screen.getByText('Vo')).toBeInTheDocument();
  });

  it('keeps identity block mounted but hidden in compact mode', () => {
    const { container } = render(SiteHeader, {
      props: {
        activeSection: 'projects',
        compact: true
      }
    });

    const identity = container.querySelector('.siteHeader_identity');
    expect(identity).toBeInTheDocument();
    expect(identity).toHaveClass('is-hidden');
    expect(identity).toHaveAttribute('aria-hidden', 'true');

    expect(screen.getByRole('button', { name: /Metrics/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Projects/i })).toBeInTheDocument();
  });

  it('keeps identity visible on metrics/projects when compact is false', async () => {
    const { component, container } = render(SiteHeader, {
      props: {
        activeSection: 'metrics',
        compact: false
      }
    });

    const identity = container.querySelector('.siteHeader_identity');
    const description = container.querySelector('.siteHeader_description');
    expect(identity).toBeInTheDocument();
    expect(identity).not.toHaveClass('is-hidden');
    expect(identity).toHaveAttribute('aria-hidden', 'false');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('is-hidden');
    expect(description).toHaveAttribute('aria-hidden', 'true');

    await component.$set({ activeSection: 'privacy' });
    expect(identity).not.toHaveClass('is-hidden');
    expect(identity).toHaveAttribute('aria-hidden', 'false');
    expect(description).not.toHaveClass('is-hidden');
    expect(description).toHaveAttribute('aria-hidden', 'false');
  });

  it('hides description on mobile even when active section is home', () => {
    const { container } = render(SiteHeader, {
      props: {
        activeSection: 'home',
        compact: false,
        isMobile: true
      }
    });

    const description = container.querySelector('.siteHeader_description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('is-hidden');
    expect(description).toHaveAttribute('aria-hidden', 'true');
  });

  it('applies mobile hidden shell class when auto-hide is active', () => {
    const { container } = render(SiteHeader, {
      props: {
        activeSection: 'projects',
        isMobile: true,
        mobileHidden: true
      }
    });

    const header = container.querySelector('.siteHeader');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('is-mobile-hidden');
    expect(header).toHaveAttribute('aria-hidden', 'true');
  });

  it('emits navigate events from nav buttons in both modes', async () => {
    const { component } = render(SiteHeader, {
      props: {
        activeSection: 'home',
        compact: false,
        isMobile: true,
        mobileHidden: false
      }
    });
    const handler = vi.fn();
    component.$on('navigate', handler);

    await fireEvent.click(screen.getByRole('button', { name: /Metrics/i }));
    expect(handler).toHaveBeenCalled();
    expect(handler.mock.calls.at(-1)?.[0]?.detail).toBe('metrics');

    await component.$set({ activeSection: 'metrics', compact: true });
    await fireEvent.click(screen.getByRole('button', { name: /Projects/i }));
    expect(handler.mock.calls.at(-1)?.[0]?.detail).toBe('projects');
  });

  it('reflects selected state from activeSection prop', () => {
    const { container } = render(SiteHeader, {
      props: {
        activeSection: 'metrics',
        compact: false
      }
    });

    const metricsItem = container.querySelector('li.is-selected .nav-button[data-name="nav-metrics"]');
    const homeItem = container.querySelector('li.is-selected .nav-button[data-name="nav-home"]');
    expect(metricsItem).toBeInTheDocument();
    expect(homeItem).not.toBeInTheDocument();
  });

  it('toggles identity visibility state without removing the identity block from DOM', async () => {
    const { component, container } = render(SiteHeader, {
      props: {
        activeSection: 'home',
        compact: false
      }
    });

    const identity = container.querySelector('.siteHeader_identity');
    expect(identity).toBeInTheDocument();
    expect(identity).not.toHaveClass('is-hidden');
    expect(identity).toHaveAttribute('aria-hidden', 'false');

    await component.$set({ compact: true });

    const identityAfterCompact = container.querySelector('.siteHeader_identity');
    expect(identityAfterCompact).toBe(identity);
    expect(identityAfterCompact).toHaveClass('is-hidden');
    expect(identityAfterCompact).toHaveAttribute('aria-hidden', 'true');

    await component.$set({ compact: false });

    const identityAfterExpand = container.querySelector('.siteHeader_identity');
    expect(identityAfterExpand).toBe(identity);
    expect(identityAfterExpand).not.toHaveClass('is-hidden');
    expect(identityAfterExpand).toHaveAttribute('aria-hidden', 'false');
  });
});
