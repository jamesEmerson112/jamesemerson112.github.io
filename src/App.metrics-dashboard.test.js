import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import fs from 'fs/promises';
import path from 'path';
import OverallCharacterDashboard from './components/portfolio/OverallCharacterDashboard.svelte';
import * as portfolioStore from './stores/portfolioStore.js';

describe('Metrics dashboard wiring', () => {
  it('mounts OverallCharacterDashboard for metrics route in App.svelte', async () => {
    const appSource = await fs.readFile(path.join(process.cwd(), 'src', 'App.svelte'), 'utf-8');

    expect(appSource).toContain("currentPage === 'metrics'");
    expect(appSource).toContain('<OverallCharacterDashboard />');
  });

  it('renders overall recruiter stat dashboard', async () => {
    portfolioStore.portfolio.reset();
    portfolioStore.portfolio.hydrate({
      portfolioTotals: {},
      repos: [
        {
          id: 'repo-a',
          name: 'Repo A',
          lastUpdated: '2026-02-10T00:00:00Z',
          summary: { code: 3000, files: 24, complexity: 120 },
          projectTags: [
            { label: 'Web', confidence: 0.8 },
            { label: 'Backend', confidence: 0.2 }
          ],
          languages: [
            { name: 'TypeScript', code: 2000, comments: 300, complexity: 90 },
            { name: 'Svelte', code: 1000, comments: 120, complexity: 30 }
          ]
        }
      ]
    });

    render(OverallCharacterDashboard);

    expect(await screen.findByText(/Generalist Character Stats/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/AI\/ML/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Quality Scorecard/i)).toBeInTheDocument();
  });
});
