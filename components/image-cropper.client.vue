<script lang="ts">
import "cropperjs";
import { CropperSelection } from "cropperjs";
</script>
<script setup lang="ts">
const props = defineProps<{
  // grid in array of [top, left, width, height]
  // relative to [0, 0, 1, 1]
  grid: number[][];
  aspectRatio: number;
}>();

const selection = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
function onSelectionChange(event: unknown) {
  const { x, y, width, height } = (event as CustomEvent).detail;
  selection.x = x;
  selection.y = y;
  selection.width = width;
  selection.height = height;
}

const selectionEl = ref<CropperSelection>();

watch(
  () => props.aspectRatio,
  (aspectRatio) => {
    if (!selectionEl.value) return;
    // TODO infer whether to use width or height
    selectionEl.value.$change(
      selection.x,
      selection.y,
      selection.height * aspectRatio,
      selection.height,
      aspectRatio
    );
  }
);

async function exportSelection() {
  return selectionEl.value?.$toCanvas();
}
defineExpose({ exportSelection });
</script>
<template>
  <!-- <div style="position: relative; height: 100%"> -->
  <cropper-canvas
    background
    ref="canvas"
    style="position: relative; width: 100%; height: 100%"
  >
    <cropper-image
      src="https://source.unsplash.com/1920x1080"
      alt="Picture"
      crossorigin="anonymous"
    ></cropper-image>
    <cropper-shade hidden></cropper-shade>
    <cropper-handle action="select" plain></cropper-handle>
    <cropper-selection
      ref="selectionEl"
      initial-coverage="0.5"
      movable
      resizable
      zoomable
      @change="onSelectionChange"
      :aspect-ratio="aspectRatio"
    >
      <!-- <cropper-grid role="grid" covered></cropper-grid> -->
      <!-- <cropper-crosshair centered></cropper-crosshair> -->
      <cropper-handle
        action="move"
        theme-color="rgba(255, 255, 255, 0.35)"
      ></cropper-handle>
      <!-- <cropper-handle action="n-resize"></cropper-handle>
      <cropper-handle action="e-resize"></cropper-handle>
      <cropper-handle action="s-resize"></cropper-handle>
      <cropper-handle action="w-resize"></cropper-handle> -->
      <cropper-handle action="ne-resize"></cropper-handle>
      <cropper-handle action="nw-resize"></cropper-handle>
      <cropper-handle action="se-resize"></cropper-handle>
      <cropper-handle action="sw-resize"></cropper-handle>
    </cropper-selection>
    <div
      :style="{
        position: 'absolute',
        top: selection.y + 'px',
        left: selection.x + 'px',
        width: selection.width + 'px',
        height: selection.height + 'px',
        border: '1px solid white',
        pointerEvents: 'none',
      }"
    >
      <div
        v-for="(section, i) in grid"
        :key="`section-${i}`"
        :style="{
          position: 'absolute',
          left: section[0] * selection.width + 'px',
          top: section[1] * selection.height + 'px',
          width: section[2] * selection.width + 'px',
          height: section[3] * selection.height + 'px',
          border: '1px solid white',
          pointerEvents: 'none',
        }"
      ></div>
    </div>
  </cropper-canvas>
  <!-- </div> -->
</template>
