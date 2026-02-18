import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import fs from 'fs/promises';
import path from 'path';
import PortfolioOverview from './components/portfolio/PortfolioOverview.svelte';
import * as portfolioStore from './stores/portfolioStore.js';

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

  it('wires PortfolioOverview into the Projects page in App.svelte', async () => {
    const appSource = await fs.readFile(path.join(process.cwd(), 'src', 'App.svelte'), 'utf-8');

    expect(appSource).toContain("currentPage === 'projects'");
    expect(appSource).toContain('<PortfolioOverview />');
  });

  it('renders advanced portfolio content and repository cards', async () => {
    render(PortfolioOverview);

    expect(await screen.findByText('Portfolio Metrics')).toBeInTheDocument();
    expect(await screen.findByText('Repo Alpha')).toBeInTheDocument();
    expect(await screen.findByText('Repo Zeta')).toBeInTheDocument();
    expect(await screen.findByText(/Web 62%/i)).toBeInTheDocument();
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
