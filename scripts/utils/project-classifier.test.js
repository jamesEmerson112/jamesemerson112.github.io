// @vitest-environment node

import { describe, expect, it } from 'vitest';
import { classifyProjectTags } from './project-classifier.js';

describe('project classifier', () => {
  it('returns top 2 tags with confidence for AI/web-heavy projects', () => {
    const tags = classifyProjectTags({
      languages: [
        { name: 'Python', percentOfCode: 55 },
        { name: 'TypeScript', percentOfCode: 30 },
        { name: 'HTML', percentOfCode: 15 }
      ],
      metadata: {
        name: 'ml-dashboard',
        description: 'AI model dashboard for recruiters',
        topics: ['ai', 'dashboard', 'web']
      }
    });

    expect(tags).toHaveLength(2);
    expect(tags[0].label).toBe('AI/ML');
    expect(tags[1].label).toBe('Web');
    expect(tags[0].confidence).toBeGreaterThanOrEqual(tags[1].confidence);
    expect(tags[0].confidence).toBeLessThanOrEqual(1);
    expect(tags[1].confidence).toBeGreaterThan(0);
  });

  it('detects devops/backend signals from infrastructure-centric languages', () => {
    const tags = classifyProjectTags({
      languages: [
        { name: 'Shell', percentOfCode: 40 },
        { name: 'Dockerfile', percentOfCode: 30 },
        { name: 'Go', percentOfCode: 30 }
      ],
      metadata: {
        name: 'infra-api',
        description: 'containerized backend service with ci pipeline',
        topics: ['devops', 'api']
      }
    });

    expect(tags).toHaveLength(2);
    expect(tags[0].label).toBe('DevOps');
    expect(tags[1].label).toBe('Backend');
  });

  it('returns empty tags when there is no useful signal', () => {
    const tags = classifyProjectTags({
      languages: [],
      metadata: {}
    });

    expect(tags).toEqual([]);
  });
});
