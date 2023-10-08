<script lang="ts">
import "cropperjs";
import { CropperCanvas, CropperImage, CropperSelection } from "cropperjs";

interface ImageMetadata {
  canvasWidth: number;
  canvasHeight: number;
  imageWidth: number;
  imageHeight: number;
  src: string;
}
</script>
<script setup lang="ts">
const props = defineProps<{
  // grid in array of [top, left, width, height]
  // relative to [0, 0, 1, 1]
  grid: number[][];
  selectionAspectRatio: number;
  src?: string;
}>();

// track select for drawing split frame
const selection = reactive({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
function onSelectionChange(event: unknown) {
  if (!canvasEl.value) return;
  const { x, y, width, height } = (event as CustomEvent).detail;
  const result = { x, y, width, height };
  const { clientWidth: canvasWidth, clientHeight: canvasHeight } =
    canvasEl.value;
  if (selection.width != width || selection.height != height) {
    // is resize event
    result.width = Math.min(width, canvasWidth);
    result.height = Math.min(height, canvasHeight);
  }
  result.x = Math.max(0, Math.min(x, canvasWidth - result.width));
  result.y = Math.max(0, Math.min(y, canvasHeight - result.height));

  if (
    result.x != x ||
    result.y != y ||
    result.width != width ||
    result.height != height
  ) {
    (event as CustomEvent).preventDefault();
  }
  Object.assign(selection, result);
}

const canvasEl = ref<CropperCanvas>();
const selectionEl = ref<CropperSelection>();
const imgEl = ref<CropperImage>();

const imageMetadata = computed(
  () =>
    new Promise<ImageMetadata | null>((resolve) => {
      imgEl.value?.$ready(() => {
        if (!props.src) {
          return resolve(null);
        }
        if (!canvasEl.value) {
          return resolve(null);
        }
        if (!imgEl.value) {
          return resolve(null);
        }
        const { clientWidth: canvasWidth, clientHeight: canvasHeight } =
          canvasEl.value;

        const { clientWidth: imageWidth, clientHeight: imageHeight } =
          imgEl.value;

        if (!canvasWidth || !canvasHeight || !imageWidth || !imageHeight) {
          return resolve(null);
        }

        const args = {
          canvasWidth,
          canvasHeight,
          imageWidth,
          imageHeight,
          src: props.src,
        };

        resolve(args);
      });
    })
);

// watch for image load and resize image / selection to fit canvas
watch(imageMetadata, async (args$) => {
  const args = await args$;
  if (!args) return;

  const { canvasWidth, canvasHeight, imageWidth, imageHeight } = args;

  const selectionSize = Math.min(canvasWidth, canvasHeight);

  const imageScaleX = canvasWidth / imageWidth;
  const imageScaleY = canvasHeight / imageHeight;
  const imageScale = Math.min(imageScaleX, imageScaleY);

  imgEl.value?.$resetTransform().$scale(imageScale, imageScale).$center();

  selectionEl.value
    ?.$reset()
    .$change(
      canvasWidth / 2 - selectionSize / 2,
      canvasHeight / 2 - selectionSize / 2,
      selectionSize,
      selectionSize
    )
    .$center();
});

// watch for selection frame aspect ratio change
// and resize selection frame to match
watch(
  () => props.selectionAspectRatio,
  (aspectRatio, prev) => {
    if (!selectionEl.value) return;
    if (aspectRatio >= 1) {
      selectionEl.value.$change(
        selection.x,
        selection.y - (selection.width / aspectRatio - selection.height) / 2,
        selection.width,
        selection.width / aspectRatio,
        aspectRatio
      );
    } else {
      selectionEl.value.$change(
        selection.x - (selection.height * aspectRatio - selection.width) / 2,
        selection.y,
        selection.height * aspectRatio,
        selection.height,
        aspectRatio
      );
    }
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
    ref="canvasEl"
    style="position: relative; width: 100%; height: 100%"
  >
    <cropper-image
      ref="imgEl"
      :src="src"
      alt="Picture"
      crossorigin="anonymous"
    ></cropper-image>
    <cropper-shade hidden></cropper-shade>
    <cropper-handle action="select" plain></cropper-handle>
    <cropper-selection
      ref="selectionEl"
      initial-coverage="1"
      movable
      resizable
      zoomable
      themeColor="rgba(0,0,0,0)"
      @change="onSelectionChange"
      :aspect-ratio="selectionAspectRatio"
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
