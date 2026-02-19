import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import RepoDetailPanel from './RepoDetailPanel.svelte';

const repoFixture = {
  id: 'repo-alpha',
  sourceRef: 'public:james/repo-alpha',
  name: 'Repo Alpha',
  url: 'https://github.com/james/repo-alpha',
  description: 'Alpha project',
  primaryLanguage: 'TypeScript',
  isPrivate: false,
  isAnonymized: false,
  projectTags: [
    { label: 'Web', confidence: 0.7 },
    { label: 'Backend', confidence: 0.3 }
  ],
  summary: {
    lines: 900,
    files: 14,
    complexity: 95,
    traditionalCost: 90000,
    aiCost: 28000,
    aiMonths: 5
  },
  languages: [
    { name: 'TypeScript', code: 500, complexity: 80 },
    { name: 'JavaScript', code: 300, complexity: 10 },
    { name: 'Svelte', code: 100, complexity: 5 }
  ]
};

describe('RepoDetailPanel', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders quality profile spider and always-visible language composition table', () => {
    const { container } = render(RepoDetailPanel, {
      props: { repo: repoFixture }
    });

    expect(screen.getAllByText('Quality Profile').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Scope').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Freshness').length).toBeGreaterThan(0);
    expect(screen.queryByRole('group', { name: 'Spider chart metric' })).not.toBeInTheDocument();

    const table = screen.getByRole('table', { name: 'Language composition breakdown' });
    expect(table).toBeInTheDocument();
    expect(within(table).getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Language composition')).toBeInTheDocument();

    const tableContainer = container.querySelector('.language-breakdown');
    const chart = container.querySelector('.detail-chart');
    expect(tableContainer?.compareDocumentPosition(chart) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('renders language bars for quick visual composition scan', async () => {
    render(RepoDetailPanel, {
      props: { repo: repoFixture }
    });

    const bars = screen.getAllByTestId('language-composition-bar');
    expect(bars.length).toBeGreaterThan(0);
    const firstBarWidth = bars[0].style.width;
    expect(firstBarWidth).toMatch(/%$/);

    const closeButton = screen.getByRole('button', { name: /Close repository details/i });
    await fireEvent.click(closeButton);
  });

  it('uses monochrome language chip styling without inline color overrides', () => {
    const { container } = render(RepoDetailPanel, {
      props: { repo: repoFixture }
    });

    const chip = container.querySelector('.language-chip');
    expect(chip).toBeInTheDocument();
    expect(chip?.getAttribute('style')).toBeNull();
  });

  it('shows repository link for public repos and hides it for private repos', () => {
    const { unmount } = render(RepoDetailPanel, {
      props: { repo: repoFixture }
    });

    const publicLink = screen.getByRole('link', { name: /View Repository/i });
    expect(publicLink).toHaveAttribute('href', repoFixture.url);

    unmount();

    render(RepoDetailPanel, {
      props: {
        repo: {
          ...repoFixture,
          id: 'repo-private',
          isPrivate: true,
          isAnonymized: true,
          url: null
        }
      }
    });

    expect(screen.queryByRole('link', { name: /View Repository/i })).not.toBeInTheDocument();
  });

  it('uses "Programming Language" label when top language is non-programming', () => {
    render(RepoDetailPanel, {
      props: {
        repo: {
          ...repoFixture,
          id: 'repo-non-programming',
          primaryLanguage: 'JSON'
        }
      }
    });

    expect(screen.getByText('Programming Language')).toBeInTheDocument();
    expect(screen.queryByText('JSON')).not.toBeInTheDocument();
  });

  it('uses updated private copy label in detail panel', () => {
    render(RepoDetailPanel, {
      props: {
        repo: {
          ...repoFixture,
          id: 'repo-private-copy',
          isPrivate: true,
          isAnonymized: true,
          description: null
        }
      }
    });

    expect(
      screen.getByText('This Private Academic Projects entry is anonymized for recruiter-safe display.')
    ).toBeInTheDocument();
  });
});
