<script lang="ts">
  const timelineData = [
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
  <div class="timeline" data-name="TimelineDiv1">
    {#each timelineData as entry, index}
      <div class="timeline-entry" data-name="TimelineDiv2">
        <div class="timeline-year" data-name="TimelineDiv3">{entry.year}</div>
        <div class="timeline-items" data-name="TimelineDiv4">
          {#each entry.items as item}
            <div class="timeline-item" data-name="TimelineDiv5">{item}</div>
          {/each}
        </div>
      </div>
    {/each}
  </div>

</div>

<style>
  .timeline-wrapper {
    width: 100%;
    margin-top: 2em;
  }

  .timeline {
    position: relative;
  }

  .timeline-entry {
    margin-bottom: 2em;
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    padding-bottom: 1.5em;
    border-bottom: 1px solid var(--border-secondary);
  }

  .timeline-entry:last-child {
    border-bottom: none;
  }

  .timeline-year {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-secondary);
    opacity: 0.6;
  }

  .timeline-items {
    display: flex;
    flex-direction: column;
    gap: 0.4em;
  }

  .timeline-item {
    font-size: 13px;
    line-height: 1.5;
    color: var(--text-primary);
    opacity: 0.85;
  }

  /* Responsive */
  @media (max-width: 768px) {
    .timeline-item {
      font-size: 12px;
    }
  }

  @media (max-width: 480px) {
    .timeline-year {
      font-size: 10px;
    }

    .timeline-item {
      font-size: 11px;
    }
  }
</style>
