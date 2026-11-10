<script lang="ts">
  import { reveal } from '../../utils/reveal.ts';
</script>

<div class="privacy_content selectable" data-name="AppDiv14">
  <div class="eyebrow" use:reveal data-name="PrivacyEyebrow">// PRIVACY</div>
  <h2 use:reveal={{ delay: 40 }} data-name="AppH215">Privacy</h2>
  <p class="privacy_summary" use:reveal={{ delay: 80 }} data-name="AppP16">
    This site uses Google Analytics<br data-name="AppBr17" />
    to understand how visitors use the site.
  </p>
  <a href="/privacy.html" target="_blank" rel="noopener noreferrer" class="privacy_link" use:reveal={{ delay: 160 }} data-name="AppA18">
    Full Privacy Policy →
  </a>
</div>

<style>
  .privacy_content {
    text-align: right;
    max-width: 600px;
  }

  .privacy_content h2 {
    font-family: var(--font-display);
    font-size: clamp(34px, 6vw, 60px);
    font-weight: 300;
    line-height: 1.05;
    letter-spacing: -0.035em;
    margin: 0;
    color: var(--scene-text);
  }

  .privacy_summary {
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-secondary);
    margin: 32px 0;
  }

  .privacy_link {
    display: inline-block;
    font-family: var(--font-mono);
    font-size: 11px;
    color: var(--mono-tone-2);
    text-decoration: none;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    padding: 0.5em 0;
    transition: color 0.3s ease;
  }

  .privacy_link:hover {
    color: var(--acc-hover);
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--acc);
    margin-bottom: 12px;
  }

  @media (max-width: 960px) {
    .privacy_content {
      text-align: left;
    }
  }
</style>
