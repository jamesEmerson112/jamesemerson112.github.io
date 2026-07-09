import { describe, expect, it } from 'vitest';
import { LANGUAGE_COLORS, OTHER_COLOR, getLanguageColor } from './languageColors.ts';

describe('languageColors', () => {
  it('returns prototype-aligned colors for known languages', () => {
    expect(getLanguageColor('Svelte')).toBe('#ff3e00');
    expect(getLanguageColor('JavaScript')).toBe('#f1e05a');
    expect(getLanguageColor('TypeScript')).toBe('#3178c6');
    expect(getLanguageColor('Python')).toBe('#3572A5');
    expect(getLanguageColor('Rust')).toBe('#dea584');
    expect(getLanguageColor('SVG')).toBe('#ff9900');
  });

  it('falls back to the neutral color for unknown languages', () => {
    expect(getLanguageColor('Brainfuck')).toBe(OTHER_COLOR);
    expect(getLanguageColor('')).toBe(OTHER_COLOR);
  });

  it('uses valid hex values throughout the map', () => {
    for (const [name, color] of Object.entries(LANGUAGE_COLORS)) {
      expect(color, `color for ${name}`).toMatch(/^#[0-9a-fA-F]{6}$/);
    }
  });
});
