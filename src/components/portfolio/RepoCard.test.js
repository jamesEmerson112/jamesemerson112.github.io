import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import RepoCard from './RepoCard.svelte';

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
    code: 900,
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

describe('RepoCard', () => {
  afterEach(() => {
    cleanup();
  });

  it('does not render the tiny mini spider and hides quality snapshot box', () => {
    const { container } = render(RepoCard, {
      props: { repo: repoFixture }
    });

    expect(container.querySelector('[data-variant="mini"]')).not.toBeInTheDocument();
    expect(screen.queryByText('Quality Snapshot')).not.toBeInTheDocument();
    expect(screen.getByText('Language composition')).toBeInTheDocument();
    expect(screen.getByText('View Details →')).toBeInTheDocument();
  });

  it('renders top-language composition strip for quick stack scan', () => {
    const { container } = render(RepoCard, {
      props: { repo: repoFixture }
    });

    const segments = container.querySelectorAll('.composition-segment');
    expect(segments.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Language composition').length).toBeGreaterThan(0);
  });

  it('uses monochrome language badge styling without inline color overrides', () => {
    const { container } = render(RepoCard, {
      props: { repo: repoFixture }
    });

    const badge = container.querySelector('.language-badge');
    expect(badge).toBeInTheDocument();
    expect(badge?.getAttribute('style')).toBeNull();
  });

  it('shows a repository link for public repos only', () => {
    const { unmount } = render(RepoCard, {
      props: { repo: repoFixture }
    });

    const publicLink = screen.getByRole('link', { name: /View Repo/i });
    expect(publicLink).toHaveAttribute('href', repoFixture.url);

    unmount();

    render(RepoCard, {
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

    expect(screen.queryByRole('link', { name: /View Repo/i })).not.toBeInTheDocument();
  });

  it('uses "Programming Language" label when top language is non-programming', () => {
    render(RepoCard, {
      props: {
        repo: {
          ...repoFixture,
          id: 'repo-non-programming',
          primaryLanguage: 'Plain Text'
        }
      }
    });

    expect(screen.getByText('Programming Language')).toBeInTheDocument();
    expect(screen.queryByText('Plain Text')).not.toBeInTheDocument();
  });

  it('uses updated private copy label', () => {
    render(RepoCard, {
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

    expect(screen.getByText('Private Academic Projects')).toBeInTheDocument();
  });
});
