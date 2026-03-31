import { describe, expect, it } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/svelte';
import fs from 'fs/promises';
import path from 'path';
import OverallCharacterDashboard from './components/portfolio/OverallCharacterDashboard.svelte';
import * as portfolioStore from './stores/portfolioStore.ts';

describe('Metrics dashboard wiring', () => {
  it('mounts OverallCharacterDashboard in the metrics section of App.svelte', async () => {
    const appSource = await fs.readFile(path.join(process.cwd(), 'src', 'App.svelte'), 'utf-8');

    expect(appSource).toContain('id="metrics"');
    expect(appSource).toContain('<OverallCharacterDashboard autoLoad={false} />');
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

    render(OverallCharacterDashboard, { props: { autoLoad: false } });

    expect(await screen.findByText(/Generalist Character Stats/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/AI\/ML/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Programming Language Proficiency/i)).toBeInTheDocument();
    expect((await screen.findAllByText(/JavaScript\/TypeScript/i)).length).toBeGreaterThan(0);
    expect((await screen.findAllByText(/C\/C\+\+\/Rust/i)).length).toBeGreaterThan(0);
    expect(await screen.findByText(/Quality Scorecard/i)).toBeInTheDocument();

    const relativeButton = await screen.findByRole('button', {
      name: /Relative \(Top axis = 100\)/i
    });
    const absoluteButton = await screen.findByRole('button', {
      name: /Absolute \(Raw score\)/i
    });

    expect(relativeButton).toHaveAttribute('aria-pressed', 'true');
    expect(absoluteButton).toHaveAttribute('aria-pressed', 'false');
    expect((await screen.findAllByText(/Rings: 25 \/ 50 \/ 75 \/ 100 \(of top axis\)/i)).length).toBeGreaterThan(0);

    await fireEvent.click(absoluteButton);

    expect(relativeButton).toHaveAttribute('aria-pressed', 'false');
    expect(absoluteButton).toHaveAttribute('aria-pressed', 'true');
    expect((await screen.findAllByText(/Rings: 25 \/ 50 \/ 75 \/ 100 \(raw score\)/i)).length).toBeGreaterThan(0);
  });

  it('supports autoLoad contract in OverallCharacterDashboard source', async () => {
    const source = await fs.readFile(
      path.join(process.cwd(), 'src', 'components', 'portfolio', 'OverallCharacterDashboard.svelte'),
      'utf-8'
    );

    expect(source).toContain('export let autoLoad = true;');
    expect(source).toContain('if (autoLoad) {');
    expect(source).toContain('loadPortfolioData();');
  });
});
