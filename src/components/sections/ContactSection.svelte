<div class="contact_content" data-name="AppDiv5">
  <h2 data-name="AppH26">Get in Touch</h2>
  <div class="contact_links" data-name="AppDiv7">
    <a
      href="https://x.com/V_like_flan"
      target="_blank"
      rel="noopener noreferrer"
      class="contact_link"
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
      data-name="AppA11"
    >
      <span class="link_label" data-name="AppSpan12">LinkedIn</span>
      <span class="link_handle" data-name="AppSpan13">james-vo</span>
    </a>
  </div>

  <div class="contact_links" data-name="AppDiv19">
    <div class="section_label" data-name="AppDiv20">Blogs I Follow</div>
    <a
      href="https://sebastianraschka.com/blog/"
      target="_blank"
      rel="noopener noreferrer"
      class="contact_link"
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
    font-weight: 200;
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
    transition: opacity 0.3s ease;
  }

  .contact_link:hover {
    opacity: 0.65;
  }

  .link_label {
    font-family: var(--font-mono);
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
  }

  .link_handle {
    font-size: 17px;
    font-weight: 400;
  }

  .section_label {
    font-family: var(--font-mono);
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--text-muted);
    margin-bottom: -4px;
  }
</style>
