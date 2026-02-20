<script>
  export let blendMode = 'difference';
</script>

<div class="copyright" style={`mix-blend-mode: ${blendMode};`} name="Copyright">
  <div class="credit" name="CopyrightDiv1">
    <span class="label" name="CopyrightSpan2">Inspired by</span>
    <a href="https://p5aholic.me/" 
       target="_blank" 
       rel="noopener noreferrer" name="CopyrightA3">
      Keita Yamada
    </a>
  </div>
</div>

<style>
  .copyright {
    position: fixed;
    z-index: 10;
    right: var(--pad);
    bottom: calc(var(--pad) * 0.5);
    font-size: 80%;
    opacity: 0.5;
    color: var(--chrome-fg);
    text-align: right;
  }
  
  .credit {
    display: flex;
    flex-direction: column;
    gap: 0.2em;
  }
  
  .label {
    font-size: 9px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    opacity: 0.7;
  }
  
  .copyright a {
    text-decoration: none;
    color: inherit;
    font-size: 11px;
  }
  
  .copyright a:hover {
    opacity: 0.7;
  }
</style>
