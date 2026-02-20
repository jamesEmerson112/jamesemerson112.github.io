<div class="mask" name="Masks">
  <div class="mask_top"></div>
  <div class="mask_bottom"></div>
</div>

<style>
  .mask {
    position: fixed;
    z-index: 3;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    pointer-events: none;
  }
  
  .mask_top,
  .mask_bottom {
    position: absolute;
    left: 0;
    width: 100%;
    height: var(--pad);
    background-color: var(--c-bg);
    opacity: 0.9;
    transition: background-color 0.9s cubic-bezier(0.1, 0.4, 0.2, 1);
  }
  
  .mask_top {
    top: 0;
  }
  
  .mask_bottom {
    bottom: 0;
  }
</style>
