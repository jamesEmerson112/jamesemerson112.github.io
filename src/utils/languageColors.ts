/* GitHub-Linguist-style language dot colors (single source of truth). */

export const LANGUAGE_COLORS: Record<string, string> = {
  JavaScript: '#f1e05a',
  TypeScript: '#3178c6',
  Python: '#3572A5',
  Svelte: '#ff3e00',
  HTML: '#e34c26',
  CSS: '#563d7c',
  SCSS: '#c6538c',
  Shell: '#89e051',
  Markdown: '#083fa1',
  JSON: '#f5f5f5',
  SQL: '#336791',
  SVG: '#ff9900',
  C: '#a8b9cc',
  'C++': '#00599c',
  Go: '#00add8',
  Rust: '#dea584',
  Java: '#b07219',
  Swift: '#f05138'
};

export const OTHER_COLOR = '#6a6d6a';

export function getLanguageColor(language: string): string {
  return LANGUAGE_COLORS[language] || OTHER_COLOR;
}
