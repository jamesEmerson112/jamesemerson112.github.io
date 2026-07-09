import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/svelte';
import CategorySpider from './CategorySpider.svelte';

afterEach(() => {
  cleanup();
});

function getAxisRow(axisLabel) {
  const table = screen.getByLabelText('Axis values');
  const row = within(table).getByText(axisLabel).closest('.axis-row');
  expect(row).toBeTruthy();
  return row;
}

describe('CategorySpider', () => {
  it('maps the highest axis to 100 in relative mode', () => {
    render(CategorySpider, {
      props: {
        title: 'Relative chart',
        stats: [
          { axis: 'Axis A', score: 30 },
          { axis: 'Axis B', score: 15 },
          { axis: 'Axis C', score: 0 }
        ],
        scaleMode: 'relative',
        showAxisTable: true
      }
    });

    const rowA = getAxisRow('Axis A');
    const rowB = getAxisRow('Axis B');
    const rowC = getAxisRow('Axis C');

    expect(within(rowA).getByText('100')).toBeInTheDocument();
    expect(within(rowB).getByText('50')).toBeInTheDocument();
    expect(within(rowC).getByText('0')).toBeInTheDocument();
    expect(screen.getByText(/Rings: 25 \/ 50 \/ 75 \/ 100 \(of top axis\)/i)).toBeInTheDocument();
  });

  it('keeps zeroed stats at zero in relative mode', () => {
    render(CategorySpider, {
      props: {
        title: 'Zero chart',
        stats: [
          { axis: 'Axis A', score: 0 },
          { axis: 'Axis B', score: 0 }
        ],
        scaleMode: 'relative',
        showAxisTable: true
      }
    });

    const rowA = getAxisRow('Axis A');
    const rowB = getAxisRow('Axis B');
    expect(within(rowA).getByText('0')).toBeInTheDocument();
    expect(within(rowB).getByText('0')).toBeInTheDocument();
  });

  it('keeps raw scores in absolute mode', () => {
    render(CategorySpider, {
      props: {
        title: 'Absolute chart',
        stats: [
          { axis: 'Axis A', score: 30 },
          { axis: 'Axis B', score: 15 }
        ],
        scaleMode: 'absolute',
        showAxisTable: true
      }
    });

    const rowA = getAxisRow('Axis A');
    const rowB = getAxisRow('Axis B');
    expect(within(rowA).getByText('30')).toBeInTheDocument();
    expect(within(rowB).getByText('15')).toBeInTheDocument();
    expect(screen.getByText(/Rings: 25 \/ 50 \/ 75 \/ 100 \(raw score\)/i)).toBeInTheDocument();
  });

  it('renders relative and absolute values together when dual mode is enabled', () => {
    render(CategorySpider, {
      props: {
        title: 'Dual table chart',
        stats: [
          { axis: 'Axis A', score: 100 },
          { axis: 'Axis B', score: 50 }
        ],
        absoluteStats: [
          { axis: 'Axis A', score: 28 },
          { axis: 'Axis B', score: 14 }
        ],
        scaleMode: 'relative',
        tableShowBoth: true,
        showAxisTable: true
      }
    });

    const rowA = getAxisRow('Axis A');
    const rowB = getAxisRow('Axis B');
    expect(within(rowA).getByText(/^R100$/i)).toBeInTheDocument();
    expect(within(rowA).getByText(/^A28$/i)).toBeInTheDocument();
    expect(within(rowB).getByText(/^R50$/i)).toBeInTheDocument();
    expect(within(rowB).getByText(/^A14$/i)).toBeInTheDocument();
  });
});
