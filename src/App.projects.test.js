import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import fs from 'fs/promises';
import path from 'path';
import PortfolioOverview from './components/portfolio/PortfolioOverview.svelte';
import * as portfolioStore from './stores/portfolioStore.ts';

const fixtureIndex = {
  portfolioTotals: {
    totalLines: 1200,
    estimatedValue: { standardCost: 120000 },
    soloDeveloper: { fullTimeYears: 2 },
    languages: { JavaScript: { percentOfTotal: 80 }, Svelte: { percentOfTotal: 20 } }
  },
  repos: [
    {
      id: 'repo-alpha',
      sourceRef: 'public:james/repo-alpha',
      name: 'Repo Alpha',
      url: 'https://github.com/james/repo-alpha',
      description: 'Alpha project',
      lastUpdated: '2026-02-02T00:00:00Z',
      primaryLanguage: 'JavaScript',
      isPrivate: false,
      isAnonymized: false,
      projectTags: [
        { label: 'Web', confidence: 0.62 },
        { label: 'Backend', confidence: 0.38 }
      ],
      languages: [
        {
          name: 'JavaScript',
          lines: 700,
          code: 650,
          complexity: 10
        },
        {
          name: 'Svelte',
          lines: 300,
          code: 280,
          complexity: 5
        }
      ],
      summary: {
        lines: 1000,
        code: 930,
        files: 15,
        complexity: 20,
        traditionalCost: 100000,
        aiCost: 25000,
        traditionalMonths: 24,
        aiMonths: 6
      },
      detailsFile: 'repos/repo-alpha.json'
    },
    {
      id: 'repo-private-beta',
      sourceRef: 'private:abc123',
      name: 'Private Repo Beta',
      url: null,
      description: null,
      lastUpdated: '2026-02-12T00:00:00Z',
      primaryLanguage: 'Plain Text',
      isPrivate: true,
      isAnonymized: true,
      projectTags: [
        { label: 'Data', confidence: 0.51 },
        { label: 'AI/ML', confidence: 0.49 }
      ],
      languages: [
        {
          name: 'Plain Text',
          lines: 4000,
          code: 3900,
          complexity: 50
        }
      ],
      summary: {
        lines: 5000,
        code: 4900,
        files: 70,
        complexity: 80,
        traditionalCost: 300000,
        aiCost: 90000,
        traditionalMonths: 48,
        aiMonths: 16
      },
      detailsFile: 'repos/private-beta.json'
    },
    {
      id: 'repo-zeta',
      sourceRef: 'public:james/repo-zeta',
      name: 'Repo Zeta',
      url: 'https://github.com/james/repo-zeta',
      description: 'Zeta project',
      lastUpdated: '2026-02-01T00:00:00Z',
      primaryLanguage: 'TypeScript',
      isPrivate: false,
      isAnonymized: false,
      projectTags: [
        { label: 'Web', confidence: 0.71 },
        { label: 'AI/ML', confidence: 0.29 }
      ],
      languages: [
        {
          name: 'TypeScript',
          lines: 200,
          code: 180,
          complexity: 3
        }
      ],
      summary: {
        lines: 200,
        code: 180,
        files: 5,
        complexity: 8,
        traditionalCost: 30000,
        aiCost: 8000,
        traditionalMonths: 8,
        aiMonths: 2
      },
      detailsFile: 'repos/repo-zeta.json'
    }
  ]
};

function createRepo(index, { isPrivate = false } = {}) {
  const padded = String(index).padStart(2, '0');
  const prefix = isPrivate ? 'Private' : 'Public';

  return {
    id: `${prefix.toLowerCase()}-repo-${padded}`,
    sourceRef: isPrivate
      ? `private:${padded}`
      : `public:james/${prefix.toLowerCase()}-repo-${padded}`,
    name: `${prefix} Repo ${padded}`,
    url: isPrivate ? null : `https://github.com/james/${prefix.toLowerCase()}-repo-${padded}`,
    description: isPrivate ? null : `${prefix} repository ${padded}`,
    lastUpdated: `2026-02-${String(Math.max(1, 20 - index)).padStart(2, '0')}T00:00:00Z`,
    primaryLanguage: isPrivate ? 'Plain Text' : 'TypeScript',
    isPrivate,
    isAnonymized: isPrivate,
    projectTags: [{ label: isPrivate ? 'Data' : 'Web', confidence: 0.72 }],
    languages: [
      {
        name: isPrivate ? 'Plain Text' : 'TypeScript',
        lines: 1200 - index * 10,
        code: 1000 - index * 9,
        complexity: isPrivate ? 40 : 20
      }
    ],
    summary: {
      lines: 1200 - index * 10,
      code: 1000 - index * 9,
      files: 10 + index,
      complexity: isPrivate ? 40 : 20,
      traditionalCost: 70000 - index * 500,
      aiCost: 20000 - index * 120,
      traditionalMonths: 18,
      aiMonths: 5
    },
    detailsFile: `repos/${prefix.toLowerCase()}-repo-${padded}.json`
  };
}

const manyReposFixture = {
  portfolioTotals: fixtureIndex.portfolioTotals,
  repos: [
    ...Array.from({ length: 14 }, (_, index) => createRepo(index + 1, { isPrivate: false })),
    ...Array.from({ length: 4 }, (_, index) => createRepo(index + 15, { isPrivate: true }))
  ]
};

describe('Option B portfolio overview integration', () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    vi.restoreAllMocks();
    portfolioStore.portfolio.reset();
    portfolioStore.resetFilters();
    portfolioStore.selectedRepo.set(null);
    portfolioStore.portfolio.hydrate(fixtureIndex);
    vi.spyOn(portfolioStore, 'loadPortfolioData').mockResolvedValue();
    vi.spyOn(portfolioStore.portfolio, 'load').mockResolvedValue();
  });

  it('renders all scroll sections with correct IDs in the main view', async () => {
    const { container } = render(PortfolioOverview, { props: { autoLoad: false } });

    // Verify App.svelte structure by reading source (section IDs are the contract)
    const appSource = await fs.readFile(path.join(process.cwd(), 'src', 'App.svelte'), 'utf-8');

    const expectedSections = ['home', 'blog', 'metrics', 'projects', 'contact', 'privacy'];
    for (const id of expectedSections) {
      expect(appSource).toContain(`id="${id}"`);
    }
    expect(appSource).toContain('<PortfolioOverview autoLoad={false} />');
    expect(appSource).toContain('<OverallCharacterDashboard autoLoad={false} />');
  });

  it('supports autoLoad contract in PortfolioOverview source', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'src', 'components', 'portfolio', 'PortfolioOverview.svelte'),
      'utf-8'
    );

    expect(source).toContain('export let autoLoad = true;');
    expect(source).toContain('if (autoLoad) {');
    expect(source).toContain('loadPortfolioData();');
  });

  it('renders advanced portfolio content and repository cards', async () => {
    render(PortfolioOverview);

    expect(await screen.findByText('Portfolio Metrics')).toBeInTheDocument();
    expect(await screen.findByText('Repo Alpha')).toBeInTheDocument();
    expect(await screen.findByText('Repo Zeta')).toBeInTheDocument();
    expect(await screen.findByText(/Web 62%/i)).toBeInTheDocument();
    expect(screen.queryByText('Quality Snapshot')).not.toBeInTheDocument();
  });

  it('applies search and language filter, and supports name sorting', async () => {
    render(PortfolioOverview);

    await screen.findByText('Repo Alpha');
    await screen.findByText('Repo Zeta');

    const searchInput = screen.getByPlaceholderText('Search repositories...');
    await fireEvent.input(searchInput, { target: { value: 'alpha' } });

    expect(await screen.findByText('Repo Alpha')).toBeInTheDocument();
    expect(screen.queryByText('Repo Zeta')).not.toBeInTheDocument();

    await fireEvent.input(searchInput, { target: { value: '' } });

    const languageSelect = screen.getByLabelText('Language:');
    await fireEvent.change(languageSelect, { target: { value: 'TypeScript' } });

    expect(await screen.findByText('Repo Zeta')).toBeInTheDocument();
    expect(screen.queryByText('Repo Alpha')).not.toBeInTheDocument();

    await fireEvent.change(languageSelect, { target: { value: 'all' } });

    const sortSelect = screen.getByLabelText('Sort by:');
    await fireEvent.change(sortSelect, { target: { value: 'name' } });

    const sortToggle = screen.getByTitle('Toggle sort order');
    await fireEvent.click(sortToggle);

    await waitFor(() => {
      const headings = screen.getAllByRole('heading', { level: 3 }).map((item) => item.textContent);
      expect(headings[0]).toBe('Repo Alpha');
      expect(headings[1]).toBe('Repo Zeta');
    });
  });

  it('keeps public repositories ahead of private repositories in rendered order', async () => {
    const { container } = render(PortfolioOverview);

    await screen.findByText('Repo Alpha');
    await screen.findByText('Repo Zeta');
    await screen.findByText('Private Repo Beta');

    const names = [...container.querySelectorAll('.repo-card h3')].map((item) => item.textContent?.trim());

    expect(names).toEqual(['Repo Alpha', 'Repo Zeta', 'Private Repo Beta']);
  });

  it('defaults to Most Recent sort and paginates projects with Load more', async () => {
    portfolioStore.portfolio.hydrate(manyReposFixture);
    const { container } = render(PortfolioOverview);

    const sortSelect = screen.getByLabelText('Sort by:');
    expect(sortSelect).toHaveValue('recent');
    expect(screen.getByRole('option', { name: 'Most Recent' })).toBeInTheDocument();

    await screen.findByText(/Recent Projects \(12 of 18\)/i);
    expect(container.querySelectorAll('.repo-card').length).toBe(12);
    expect(screen.getByRole('button', { name: /Load 12 more/i })).toBeInTheDocument();

    await fireEvent.click(screen.getByRole('button', { name: /Load 12 more/i }));
    await waitFor(() => {
      expect(container.querySelectorAll('.repo-card').length).toBe(18);
    });
    expect(screen.queryByRole('button', { name: /Load 12 more/i })).not.toBeInTheDocument();
  });

  it('resets visible project count to 12 when filters/search change', async () => {
    portfolioStore.portfolio.hydrate(manyReposFixture);
    const { container } = render(PortfolioOverview);

    await screen.findByText(/Recent Projects \(12 of 18\)/i);
    await fireEvent.click(screen.getByRole('button', { name: /Load 12 more/i }));

    await waitFor(() => {
      expect(container.querySelectorAll('.repo-card').length).toBe(18);
    });

    const searchInput = screen.getByPlaceholderText('Search repositories...');
    await fireEvent.input(searchInput, { target: { value: 'Public Repo 01' } });
    await screen.findByText(/Recent Projects \(1 of 1\)/i);

    await fireEvent.input(searchInput, { target: { value: '' } });
    await waitFor(() => {
      expect(container.querySelectorAll('.repo-card').length).toBe(12);
    });
  });

  it('supports category filtering and removes mini spider from project cards', async () => {
    const { container } = render(PortfolioOverview);

    await screen.findByText('Repo Alpha');
    await screen.findByText('Repo Zeta');

    const categoryButton = screen.getByRole('button', { name: 'AI/ML' });
    await fireEvent.click(categoryButton);

    expect(await screen.findByText('Repo Zeta')).toBeInTheDocument();
    expect(screen.queryByText('Repo Alpha')).not.toBeInTheDocument();
    expect(container.querySelector('[data-variant="mini"]')).not.toBeInTheDocument();
  });

  it('opens and closes detail panel from a repository card', async () => {
    render(PortfolioOverview);

    await screen.findByText('Repo Alpha');

    await fireEvent.click(screen.getByRole('button', { name: /Open details for Repo Alpha/i }));

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(await screen.findByText(/Project Type Signals/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/Backend 38%/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Quality Profile/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Scope/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/Freshness/i)).length).toBeGreaterThan(0);
    const closeButton = await screen.findByRole('button', { name: /Close repository details/i });
    expect(closeButton).toHaveFocus();
    await fireEvent.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });
});
