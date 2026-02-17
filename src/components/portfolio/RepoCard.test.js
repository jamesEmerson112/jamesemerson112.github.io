import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/svelte';
import RepoCard from './RepoCard.svelte';

const repoFixture = {
  id: 'repo-alpha',
  sourceRef: 'public:james/repo-alpha',
  name: 'Repo Alpha',
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

  it('does not render the tiny mini spider and shows quality snapshot rows', () => {
    const { container } = render(RepoCard, {
      props: { repo: repoFixture }
    });

    expect(container.querySelector('[data-variant="mini"]')).not.toBeInTheDocument();
    expect(screen.getByText('Quality Snapshot')).toBeInTheDocument();
    expect(screen.getByText('Scope')).toBeInTheDocument();
  });

  it('renders top-language composition strip for quick stack scan', () => {
    const { container } = render(RepoCard, {
      props: { repo: repoFixture }
    });

    const segments = container.querySelectorAll('.composition-segment');
    expect(segments.length).toBeGreaterThan(0);
    expect(screen.getAllByText('Language composition').length).toBeGreaterThan(0);
  });
});
