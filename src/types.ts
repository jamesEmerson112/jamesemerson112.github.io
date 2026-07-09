// ─── Portfolio Index (from /metrics/index.json) ──────────────────

export interface PortfolioIndex {
  version: string;
  generatedAt: string;
  lastFullScan: string;
  lastIncrementalScan: string;
  reposScannedThisRun: number;
  reposReusedThisRun: number;
  totalPublicRepos: number;
  totalPrivateRepos: number;
  totalRepos: number;
  portfolioTotals: PortfolioTotals;
  repos: Repo[];
}

export interface PortfolioTotals {
  totalLines: number;
  totalCode: number;
  totalComments: number;
  totalBlanks: number;
  totalFiles: number;
  totalBytes: number;
  totalComplexity: number;
  estimatedValue: {
    standardCost: number;
    totalEffort: number;
    avgTime: number;
    avgPeople: number;
  };
  soloDeveloper: {
    fullTimeMonths: number;
    fullTimeYears: number;
    fullTimeWeeks: number;
    description: string;
  };
  languages: Record<string, PortfolioLanguageSummary>;
}

export interface PortfolioLanguageSummary {
  repos: number;
  totalLines: number;
  totalCode: number;
  percentOfTotal: number;
  averagePerRepo: number;
}

// ─── Repo ────────────────────────────────────────────────────────

export interface Repo {
  id: string;
  sourceRef: string;
  name: string;
  url: string | null;
  description: string | null;
  lastUpdated: string;
  primaryLanguage: string;
  isPrivate: boolean;
  isAnonymized: boolean;
  projectTags: ProjectTag[];
  languages: RepoLanguageEntry[];
  summary: RepoSummary;
  detailsFile: string;
}

export interface RepoLanguageEntry {
  name: string;
  lines: number;
  code: number;
  comments: number;
  blanks: number;
  bytes: number;
  files: number;
  complexity: number;
  percentOfLines: number;
  percentOfCode: number;
  percentOfBytes: number;
}

export interface ProjectTag {
  label: string;
  confidence: number;
}

export interface RepoSummary {
  lines: number;
  code: number;
  files: number;
  complexity: number;
  traditionalCost: number;
  aiCost: number;
  traditionalMonths: number;
  aiMonths: number;
}

// ─── Computed / Derived Types ────────────────────────────────────

export interface CompositionEntry {
  name: string;
  code: number;
  lines: number;
  complexity: number;
  percent: number;
  complexityPercent: number;
}

export interface SpiderDataPoint {
  name: string;
  code: number;
  complexity: number;
  codePercent: number;
  complexityPercent: number;
  valuePercent: number;
  isOther?: boolean;
}

export interface AxisScore {
  axis: string;
  score: number;
}

export type QualityBand = 'Low' | 'Moderate' | 'High' | 'Very High';

export interface QualitySignal {
  axis: string;
  score: number;
  band: QualityBand;
}

// ─── Blog ────────────────────────────────────────────────────────

export interface BlogPostMeta {
  slug: string;
  title: string;
  date: string;
  excerpt: string;
}

export interface FrontmatterResult {
  meta: Record<string, string>;
  content: string;
}

// ─── Routing ─────────────────────────────────────────────────────

export type RouteView = 'main' | 'blog' | 'post';

export interface ParsedRoute {
  view: RouteView;
  section: string | null;
  slug: string | null;
}

export interface NavItem {
  id: string;
  label: string;
}

// ─── Store Helpers ───────────────────────────────────────────────

export type SortKey = 'recent' | 'lines' | 'updated' | 'cost' | 'name';
export type SortOrder = 'asc' | 'desc';

export interface PortfolioStoreState {
  data: PortfolioIndex | null;
  loading: boolean;
  error: string | null;
}

// ─── Utility Factory Params ──────────────────────────────────────

export interface ScrollSyncParams {
  scrollRoot: HTMLElement;
  sectionElements: Map<string, HTMLElement>;
  sectionIds: readonly string[];
  isValidSection: (id: string) => boolean;
  onSectionChange: (sectionId: string) => void;
}

export interface DataPreloaderParams {
  scrollRoot: HTMLElement;
  sectionElements: Map<string, HTMLElement>;
  preloadSections: Iterable<string>;
  onPreload: () => void;
}

export interface ViewportDetectionParams {
  breakpoint: number;
  onChange: (isMobile: boolean) => void;
}

export interface Destroyable {
  destroy: () => void;
}
