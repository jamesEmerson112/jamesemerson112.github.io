<script>
  export let blendMode = 'difference';
</script>

<div class="frame" style={`mix-blend-mode: ${blendMode};`}>
  <div class="frame_line frame_line-left"></div>
  <div class="frame_line frame_line-right"></div>
  <div class="frame_line frame_line-top"></div>
  <div class="frame_line frame_line-bottom"></div>
</div>

<style>
  .frame {
    position: fixed;
    z-index: 10;
    left: var(--pad);
    right: var(--pad);
    top: var(--pad);
    bottom: var(--pad);
    pointer-events: none;
  }
  
  .frame_line {
    position: absolute;
    background-color: var(--chrome-fg);
    opacity: 0.5;
  }
  
  .frame_line-left {
    left: 0;
    top: 0;
    width: 1px;
    height: 100%;
  }
  
  .frame_line-right {
    right: 0;
    top: 0;
    width: 1px;
    height: 100%;
  }
  
  .frame_line-top {
    left: 0;
    top: 0;
    width: 100%;
    height: 1px;
  }
  
  .frame_line-bottom {
    left: 0;
    bottom: 0;
    width: 100%;
    height: 1px;
  }
</style>
