<script>
  export let blendMode = 'difference';
</script>

<div class="content" style={`mix-blend-mode: ${blendMode};`} name="ContentLayer">
  <div class="content_inner" name="ContentLayerDiv1">
    <slot />
  </div>
</div>

<style>
  .content {
    position: fixed;
    z-index: 2;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }
  
  .content_inner {
    position: relative;
    width: 100%;
    height: 100%;
  }
</style>
