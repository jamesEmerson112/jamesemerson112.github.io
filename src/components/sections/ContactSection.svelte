<script lang="ts">
  import { reveal } from '../../utils/reveal.ts';
</script>

<div class="contact_content selectable" data-name="AppDiv5">
  <div class="eyebrow" use:reveal data-name="ContactEyebrow">// CONTACT</div>
  <h2 use:reveal={{ delay: 40 }} data-name="AppH26">Get in Touch</h2>
  <div class="contact_links" data-name="AppDiv7">
    <a
      href="https://x.com/V_like_flan"
      target="_blank"
      rel="noopener noreferrer"
      class="contact_link"
      use:reveal={{ delay: 80 }}
      data-name="AppA8"
    >
      <span class="link_label" data-name="AppSpan9">Twitter</span>
      <span class="link_handle" data-name="AppSpan10">@V_like_flan</span>
    </a>

    <a
      href="https://www.linkedin.com/in/james-vo/"
      target="_blank"
      rel="noopener noreferrer"
      class="contact_link"
      use:reveal={{ delay: 160 }}
      data-name="AppA11"
    >
      <span class="link_label" data-name="AppSpan12">LinkedIn</span>
      <span class="link_handle" data-name="AppSpan13">james-vo</span>
    </a>
  </div>

  <div class="contact_links" data-name="AppDiv19">
    <div class="section_label" use:reveal={{ delay: 160 }} data-name="AppDiv20">Blogs I Follow</div>
    <a
      href="https://sebastianraschka.com/blog/"
      target="_blank"
      rel="noopener noreferrer"
      class="contact_link"
      use:reveal={{ delay: 240 }}
      data-name="AppA21"
    >
      <span class="link_label" data-name="AppSpan22">AI / ML Research</span>
      <span class="link_handle" data-name="AppSpan23">Sebastian Raschka</span>
    </a>

    <a
      href="https://karpathy.ai/"
      target="_blank"
      rel="noopener noreferrer"
      class="contact_link"
      use:reveal={{ delay: 320 }}
      data-name="AppA24"
    >
      <span class="link_label" data-name="AppSpan25">AI / Deep Learning</span>
      <span class="link_handle" data-name="AppSpan26">Andrej Karpathy</span>
    </a>
  </div>
</div>

<style>
  .contact_content {
    text-align: right;
    max-width: 600px;
  }

  .contact_content h2 {
    font-family: var(--font-display);
    font-size: clamp(34px, 6vw, 60px);
    font-weight: 300;
    line-height: 1.05;
    letter-spacing: -0.035em;
    margin: 0;
    color: var(--scene-text);
  }

  .contact_links {
    display: flex;
    flex-direction: column;
    gap: 28px;
    margin-top: 44px;
  }

  .contact_link {
    display: flex;
    flex-direction: column;
    gap: 5px;
    text-decoration: none;
    color: var(--scene-text);
  }

  /* Out of flow so right-aligned handles stay flush with their labels. */
  .link_handle::after {
    content: '↗';
    position: absolute;
    right: -1.05em;
    top: 0.18em;
    font-size: 0.75em;
    color: var(--acc);
    opacity: 0;
    transform: translate(-4px, 4px);
    transition: opacity 0.3s ease, transform 0.4s var(--ease-out-expo, ease);
  }

  .contact_link:hover .link_handle {
    color: var(--acc-hover);
  }

  .contact_link:hover .link_handle::after {
    opacity: 1;
    transform: none;
  }

  .contact_link:focus-visible {
    outline: 2px solid var(--acc);
    outline-offset: 4px;
    border-radius: 4px;
  }

  .link_label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
  }

  .link_handle {
    position: relative;
    font-family: var(--font-display);
    font-size: 24px;
    font-weight: 300;
    letter-spacing: -0.01em;
    transition: color 0.25s ease;
  }

  .section_label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
    margin-bottom: -4px;
  }

  .eyebrow {
    font-family: var(--font-mono);
    font-size: 10.5px;
    letter-spacing: 0.2em;
    color: var(--acc);
    margin-bottom: 12px;
  }

  /* Mobile follows the rest of the page: left-aligned reading edge. */
  @media (max-width: 960px) {
    .contact_content {
      text-align: left;
    }

    .link_handle::after {
      right: auto;
      left: calc(100% + 0.3em);
    }
  }
</style>
