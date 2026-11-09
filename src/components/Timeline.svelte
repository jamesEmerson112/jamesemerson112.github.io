<script lang="ts">
  import { reveal } from '../utils/reveal.ts';

  const timelineData = [
    {
      year: '2026',
      items: [
        '3 Year Anniversary at JCM Global'
      ]
    },
    {
      year: '2025',
      items: [
        'Won SF10X Hackathon (Summer)',
        'Won Annual Las Vegas AI Hackathon'
      ]
    },
    {
      year: '2024',
      items: [
        'Started Master of Science in CS at Georgia Tech'
      ]
    },
    {
      year: '2023-Present',
      items: [
        'Software Developer I at JCM Global'
      ]
    },
    {
      year: '2022',
      items: [
        'Vice President of Sigma Alpha Mu',
        'College Intramural Basketball Championship',
        'Hackathon Bootcamp at HackReactor, San Francisco'
      ]
    },
    {
      year: '2017-2022 (UNLV Years)',
      items: [
        'Bachelor of Science in Computer Science',
        'ACM Member (2018)',
        'Team Lead at UNLV Satellite (2020)'
      ]
    },
    {
      year: '2014-2017 (Early Career)',
      items: [
        'Assistant Manager at Sushi Kaya',
        'Manager at Color Nails'
      ]
    }
  ];

</script>

<div class="timeline-wrapper" data-name="Timeline">
  <ol class="timeline" data-name="TimelineDiv1">
    {#each timelineData as entry, index}
      <li class="timeline-entry" class:is-current={index === 0} use:reveal={{ delay: 40 }} data-name="TimelineDiv2">
        <span class="timeline-node" aria-hidden="true" data-name="TimelineNode"></span>
        <div class="timeline-year" data-name="TimelineDiv3">{entry.year}</div>
        <div class="timeline-items" data-name="TimelineDiv4">
          {#each entry.items as item}
            <div class="timeline-item" data-name="TimelineDiv5">{item}</div>
          {/each}
        </div>
      </li>
    {/each}
  </ol>
</div>

<style>
  .timeline-wrapper {
    width: 100%;
    margin-top: 1.4em;
  }

  /* Vertical rail on the reading edge (right on desktop, left on mobile). */
  .timeline {
    position: relative;
    list-style: none;
    margin: 0;
    padding: 0 30px 0 0;
  }

  .timeline::before {
    content: '';
    position: absolute;
    top: 10px;
    bottom: 10px;
    right: 4px;
    width: 1px;
    background: linear-gradient(
      to bottom,
      color-mix(in srgb, var(--acc) 70%, transparent) 0%,
      var(--line-1) 22%,
      var(--line-3) 100%
    );
  }

  .timeline-entry {
    position: relative;
    display: flex;
    flex-direction: column;
    gap: 9px;
    padding: 18px 0 20px;
  }

  .timeline-node {
    position: absolute;
    top: 21px;
    right: -30px;
    width: 9px;
    height: 9px;
    border-radius: 50%;
    border: 1px solid var(--line-1);
    background: var(--scene-canvas);
    transition: border-color 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease;
  }

  .timeline-entry:hover .timeline-node {
    border-color: var(--acc);
    background: color-mix(in srgb, var(--acc) 35%, var(--scene-canvas));
  }

  .is-current .timeline-node {
    border-color: var(--acc);
    background: var(--acc);
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--acc) 16%, transparent),
      0 0 16px color-mix(in srgb, var(--acc) 70%, transparent);
  }

  .timeline-year {
    font-family: var(--font-mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.18em;
    color: var(--accent-info);
    transition: color 0.3s ease;
  }

  /* Current-year entry gets the full accent */
  .is-current .timeline-year,
  .timeline-entry:hover .timeline-year {
    color: var(--acc);
  }

  .timeline-items {
    display: flex;
    flex-direction: column;
    gap: 0.35em;
  }

  .timeline-item {
    font-size: 15px;
    line-height: 1.6;
    color: var(--mono-tone-2);
  }

  .is-current .timeline-item {
    color: var(--text-primary);
  }

  /* Responsive */
  @media (max-width: 960px) {
    .timeline {
      padding: 0 0 0 28px;
    }

    .timeline::before {
      right: auto;
      left: 4px;
    }

    .timeline-node {
      right: auto;
      left: -28px;
    }
  }

  @media (max-width: 768px) {
    .timeline-item {
      font-size: 14px;
    }
  }
</style>
