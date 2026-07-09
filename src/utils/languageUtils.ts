import type { CompositionEntry } from '../types.js';
import { getLanguageColor } from './languageColors.ts';

export { getLanguageColor };

export const NON_PROGRAMMING_LANGUAGE_NAMES = new Set([
  'plain text',
  'markdown',
  'json',
  'csv',
  'license',
  'yaml',
  'yml',
  'toml',
  'xml',
  'tex'
]);

export function isNonProgrammingLanguage(language: string): boolean {
  const normalized = String(language || '').trim().toLowerCase();
  return NON_PROGRAMMING_LANGUAGE_NAMES.has(normalized);
}

interface LanguageInput {
  name?: string;
  code?: number;
  lines?: number;
  complexity?: number;
  [key: string]: unknown;
}

type LanguagesParam = LanguageInput[] | Record<string, Partial<LanguageInput>>;

interface NormalizedEntry {
  name: string;
  code: number;
  lines: number;
  complexity: number;
}

export function getDisplayPrimaryLanguage(language: string, languages: LanguagesParam = []): string {
  return resolveDominantProgrammingLanguage(language, languages);
}

function toMetricNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeLanguageEntry(language: unknown): NormalizedEntry {
  if (language && typeof language === 'object') {
    const lang = language as LanguageInput;
    return {
      name: String(lang.name || '').trim(),
      code: toMetricNumber(lang.code ?? lang.lines),
      lines: toMetricNumber(lang.lines),
      complexity: toMetricNumber(lang.complexity)
    };
  }

  return { name: '', code: 0, lines: 0, complexity: 0 };
}

function toLanguageEntryList(languages: LanguagesParam): NormalizedEntry[] {
  if (Array.isArray(languages)) {
    return languages
      .map(normalizeLanguageEntry)
      .filter((language) => language.name.length > 0);
  }

  if (languages && typeof languages === 'object') {
    return Object.entries(languages)
      .map(([name, details]) => normalizeLanguageEntry({
        ...(details && typeof details === 'object' ? details : {}),
        name
      }))
      .filter((language) => language.name.length > 0);
  }

  return [];
}

function compareLanguageEntriesByDominance(a: NormalizedEntry, b: NormalizedEntry): number {
  const codeDelta = b.code - a.code;
  if (codeDelta !== 0) return codeDelta;

  const linesDelta = b.lines - a.lines;
  if (linesDelta !== 0) return linesDelta;

  return a.name.localeCompare(b.name);
}

interface CompositionOptions {
  maxProgrammingLanguages?: number;
  otherThresholdPercent?: number;
}

export function buildProgrammingComposition(languages: LanguagesParam = [], options: CompositionOptions = {}): CompositionEntry[] {
  const maxProgrammingLanguages = Number.isFinite(Number(options.maxProgrammingLanguages))
    ? Math.max(0, Math.floor(Number(options.maxProgrammingLanguages)))
    : Number.POSITIVE_INFINITY;
  const otherThresholdPercent = Number.isFinite(Number(options.otherThresholdPercent))
    ? Math.max(0, Number(options.otherThresholdPercent))
    : 0.5;

  const sortedEntries = toLanguageEntryList(languages)
    .sort(compareLanguageEntriesByDominance);
  const totalCode = sortedEntries.reduce((sum, entry) => sum + entry.code, 0);

  if (totalCode <= 0) return [];

  const totalComplexity = sortedEntries.reduce((sum, entry) => sum + entry.complexity, 0);
  const sharedEntries: CompositionEntry[] = sortedEntries.map((entry) => ({
    ...entry,
    percent: (entry.code / totalCode) * 100,
    complexityPercent: totalComplexity > 0
      ? (entry.complexity / totalComplexity) * 100
      : 0
  }));

  const keptProgrammingEntries = sharedEntries
    .filter((entry) => !isNonProgrammingLanguage(entry.name))
    .slice(0, maxProgrammingLanguages);
  const keptProgrammingNames = new Set(keptProgrammingEntries.map((entry) => entry.name));
  const keptProgrammingShare = keptProgrammingEntries
    .reduce((sum, entry) => sum + entry.percent, 0);
  const otherShare = Math.max(0, 100 - keptProgrammingShare);

  if (otherShare < otherThresholdPercent) return keptProgrammingEntries;

  const otherEntries = sharedEntries.filter((entry) => !keptProgrammingNames.has(entry.name));
  const otherCode = otherEntries.reduce((sum, entry) => sum + entry.code, 0);
  const otherComplexity = otherEntries.reduce((sum, entry) => sum + entry.complexity, 0);
  const otherComplexityPercent = totalComplexity > 0
    ? (otherComplexity / totalComplexity) * 100
    : 0;

  return [
    ...keptProgrammingEntries,
    {
      name: 'Other',
      code: otherCode,
      lines: 0,
      complexity: otherComplexity,
      percent: otherShare,
      complexityPercent: otherComplexityPercent
    }
  ];
}

export function resolveDominantProgrammingLanguage(primaryLanguage: string, languages: LanguagesParam = []): string {
  const normalizedPrimary = String(primaryLanguage || '').trim();
  if (normalizedPrimary && !isNonProgrammingLanguage(normalizedPrimary)) {
    return normalizedPrimary;
  }

  const rankedLanguages = toLanguageEntryList(languages)
    .sort(compareLanguageEntriesByDominance);

  const firstProgrammingLanguage = rankedLanguages
    .find((language) => !isNonProgrammingLanguage(language.name));

  return firstProgrammingLanguage?.name || 'N/A';
}

function normalizeHexColor(input: string): string | null {
  const value = String(input || '').trim();
  const hex = value.startsWith('#') ? value.slice(1) : value;

  if (/^[0-9a-fA-F]{3}$/.test(hex)) {
    return hex
      .split('')
      .map((part) => part + part)
      .join('')
      .toLowerCase();
  }

  if (/^[0-9a-fA-F]{6}$/.test(hex)) {
    return hex.toLowerCase();
  }

  return null;
}

export function getContrastTextColor(hexColor: string): string {
  const normalized = normalizeHexColor(hexColor);
  if (!normalized) return '#f8fafc';

  const r = parseInt(normalized.slice(0, 2), 16) / 255;
  const g = parseInt(normalized.slice(2, 4), 16) / 255;
  const b = parseInt(normalized.slice(4, 6), 16) / 255;

  const linear = (channel: number) => (
    channel <= 0.03928
      ? channel / 12.92
      : ((channel + 0.055) / 1.055) ** 2.4
  );

  const luminance = (0.2126 * linear(r)) + (0.7152 * linear(g)) + (0.0722 * linear(b));

  return luminance > 0.45 ? '#0f172a' : '#f8fafc';
}
