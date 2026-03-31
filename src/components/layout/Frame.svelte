<script lang="ts">
  export let blendMode = 'difference';
</script>

<div class="frame" style={`mix-blend-mode: ${blendMode};`} data-name="Frame">
  <div class="frame_line frame_line-left" data-name="FrameDiv1"></div>
  <div class="frame_line frame_line-right" data-name="FrameDiv2"></div>
  <div class="frame_line frame_line-top" data-name="FrameDiv3"></div>
  <div class="frame_line frame_line-bottom" data-name="FrameDiv4"></div>
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

  @media (max-width: 900px) {
    .frame {
      display: none;
    }
  }
</style>
