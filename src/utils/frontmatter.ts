import type { FrontmatterResult } from '../types.js';

export function parseFrontmatter(raw: string): FrontmatterResult {
  // Strip a UTF-8 BOM (PowerShell / older Notepad) and normalize CRLF.
  const normalized = raw.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n');
  const match = normalized.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return { meta: {}, content: normalized };

  const meta: Record<string, string> = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx === -1) continue;
    const key = line.slice(0, idx).trim();
    const val = unquote(line.slice(idx + 1).trim());
    meta[key] = val;
  }
  return { meta, content: match[2] };
}

/* `"Part 1: Intro"` → `Part 1: Intro` (matching quotes only). */
function unquote(value: string): string {
  const quoted = value.match(/^(['"])([\s\S]*)\1$/);
  return quoted ? quoted[2] : value;
}

/* Accept YYYY-MM-DD (also unpadded YYYY-M-D); null when not a real date. */
export function normalizeDate(value: string): string | null {
  const match = String(value ?? '').trim().match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (!match) return null;
  const [year, month, day] = [match[1], match[2].padStart(2, '0'), match[3].padStart(2, '0')];
  const date = new Date(`${year}-${month}-${day}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.getUTCDate() !== Number(day)) return null;
  return `${year}-${month}-${day}`;
}

/* `tags: [a, b]` or `tags: a, b` → ['a', 'b'] */
export function parseTagList(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((tag) => String(tag).trim()).filter(Boolean);
  const raw = String(value ?? '').trim().replace(/^\[/, '').replace(/\]$/, '');
  if (!raw) return [];
  return raw
    .split(',')
    .map((tag) => tag.trim().replace(/^['"]|['"]$/g, '').trim())
    .filter(Boolean);
}

const WORDS_PER_MINUTE = 230;

/* Minutes to read, counting prose words; fenced code counts at a third.
   Mirrors estimateReadingMinutes() in scripts/build-blog-index.js. */
export function estimateReadingMinutes(markdown: string): number {
  const text = String(markdown || '');
  let codeWords = 0;
  const prose = text.replace(/```[\s\S]*?```/g, (block) => {
    codeWords += block.split(/\s+/).filter(Boolean).length;
    return ' ';
  });
  const proseWords = prose
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/[#>*_`~[\]()-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  const minutes = (proseWords + codeWords / 3) / WORDS_PER_MINUTE;
  return Math.max(1, Math.round(minutes));
}
