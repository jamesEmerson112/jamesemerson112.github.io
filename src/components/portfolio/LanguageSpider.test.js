import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import LanguageSpider from './LanguageSpider.svelte';

const manyLanguages = [
  { name: 'TypeScript', code: 500, complexity: 50 },
  { name: 'JavaScript', code: 300, complexity: 10 },
  { name: 'Svelte', code: 100, complexity: 5 },
  { name: 'JSON', code: 60, complexity: 0 },
  { name: 'HTML', code: 20, complexity: 0 },
  { name: 'CSS', code: 10, complexity: 0 }
];

describe('LanguageSpider', () => {
  it('uses compact mini mode with no labels/legend and top-4 plus other', () => {
    const { container } = render(LanguageSpider, {
      props: {
        languages: manyLanguages,
        variant: 'mini',
        metric: 'code',
        maxAxes: 4,
        aggregateOther: true,
        showLabels: true,
        showLegend: true,
        size: 160
      }
    });

    expect(container.querySelector('[data-variant="mini"]')).toBeInTheDocument();
    expect(container.querySelectorAll('.language-label')).toHaveLength(0);
    expect(container.querySelector('.legend')).not.toBeInTheDocument();
    expect(container.querySelectorAll('.data-point')).toHaveLength(5);
  });

  it('updates detail metric rendering when metric prop changes', async () => {
    const { component, container } = render(LanguageSpider, {
      props: {
        languages: manyLanguages,
        variant: 'detail',
        metric: 'code',
        maxAxes: 8,
        aggregateOther: true,
        showLabels: true,
        showLegend: true,
        size: 300
      }
    });

    expect(screen.getByText('Code % share')).toBeInTheDocument();
    const initialPath = container.querySelector('.data-shape')?.getAttribute('d');

    await component.$set({ metric: 'complexity' });

    expect(screen.getByText('Complexity % share')).toBeInTheDocument();
    const updatedPath = container.querySelector('.data-shape')?.getAttribute('d');
    expect(updatedPath).toBeTruthy();
    expect(updatedPath).not.toEqual(initialPath);
  });

  it('renders complexity mode without invalid geometry when values are zero', () => {
    const { container } = render(LanguageSpider, {
      props: {
        languages: [
          { name: 'JSON', code: 100, complexity: 0 },
          { name: 'Markdown', code: 80, complexity: 0 }
        ],
        variant: 'detail',
        metric: 'complexity',
        maxAxes: 8,
        aggregateOther: true,
        size: 280
      }
    });

    const shape = container.querySelector('.data-shape');
    expect(shape).toBeInTheDocument();
    expect(shape?.getAttribute('d')).not.toContain('NaN');

    const points = container.querySelectorAll('.data-point');
    for (const point of points) {
      const x = Number(point.getAttribute('cx'));
      const y = Number(point.getAttribute('cy'));
      expect(Number.isFinite(x)).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });
});
