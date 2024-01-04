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

interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
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

const canvasEl = ref<CropperCanvas>();
const selectionEl = ref<CropperSelection>();
const imgEl = ref<CropperImage>();

// track select for drawing split frame
const selection = reactive<Box>({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
});
// track selection for drawing grid
// and constrain selection to canvas size
function onSelectionChange(event: unknown) {
  if (!canvasEl.value) return;
  const { x, y, width, height } = (event as CustomEvent).detail;
  const result = { x, y, width, height };
  const { canvasWidth, canvasHeight } = metadata.value;
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

function getBoundingBoxFitWithAspectRatio(
  bounds: Box,
  aspectRatio: number
): Box {
  const { x, y, width, height } = bounds;
  const { canvasWidth, canvasHeight } = metadata.value;
  const boundWithinCanvas = {
    x: Math.max(0, Math.min(x, canvasWidth - width)),
    y: Math.max(0, Math.min(y, canvasHeight - height)),
    width: Math.min(width, canvasWidth),
    height: Math.min(height, canvasHeight),
  };

  if (aspectRatio >= 1) {
    // landscape
    const newHeight = boundWithinCanvas.width / aspectRatio;
    const newWidth = boundWithinCanvas.height * aspectRatio;
    if (newHeight <= boundWithinCanvas.height) {
      return {
        x: boundWithinCanvas.x,
        y: boundWithinCanvas.y + (boundWithinCanvas.height - newHeight) / 2,
        width: boundWithinCanvas.width,
        height: newHeight,
      };
    } else {
      return {
        x: boundWithinCanvas.x + (boundWithinCanvas.width - newWidth) / 2,
        y: boundWithinCanvas.y,
        width: newWidth,
        height: boundWithinCanvas.height,
      };
    }
  } else {
    // portrait
    const newHeight = boundWithinCanvas.width / aspectRatio;
    const newWidth = boundWithinCanvas.height * aspectRatio;
    if (newHeight <= boundWithinCanvas.height) {
      return {
        x: boundWithinCanvas.x + (boundWithinCanvas.width - newWidth) / 2,
        y: boundWithinCanvas.y,
        width: newWidth,
        height: boundWithinCanvas.height,
      };
    } else {
      return {
        x: boundWithinCanvas.x,
        y: boundWithinCanvas.y + (boundWithinCanvas.height - newHeight) / 2,
        width: boundWithinCanvas.width,
        height: newHeight,
      };
    }
  }
}

const { width: canvasWidthRef, height: canvasHeightRef } =
  useElementSize(canvasEl);
const { width: imgWidthRef, height: imgHeightRef } = useElementSize(imgEl);

const metadata = computed<ImageMetadata>(() => ({
  canvasWidth: canvasWidthRef.value,
  canvasHeight: canvasHeightRef.value,
  imageWidth: imgWidthRef.value,
  imageHeight: imgHeightRef.value,
  src: props.src!,
}));

function initImageAndSelection() {
  const { canvasWidth, canvasHeight, imageWidth, imageHeight } = metadata.value;

  const imageScaleX = canvasWidth / imageWidth;
  const imageScaleY = canvasHeight / imageHeight;
  const imageScale = Math.min(imageScaleX, imageScaleY);

  imgEl.value?.$resetTransform().$scale(imageScale, imageScale).$center();

  const selectionBox = getBoundingBoxFitWithAspectRatio(
    {
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
    },
    props.selectionAspectRatio
  );
  selectionEl.value?.$change(
    selectionBox.x,
    selectionBox.y,
    selectionBox.width - 1,
    selectionBox.height - 1,
    props.selectionAspectRatio
  );
}

// watch for image load and resize image / selection to fit canvas
watch(metadata, (metadata) => {
  const { canvasWidth, canvasHeight, imageWidth, imageHeight } = metadata;
  if (
    canvasWidth > 0 &&
    canvasHeight > 0 &&
    imageWidth > 0 &&
    imageHeight > 0
  ) {
    initImageAndSelection();
  }
});

// watch for selection frame aspect ratio change
// and resize selection frame to match
watch(
  () => props.selectionAspectRatio,
  (aspectRatio, _) => {
    if (!selectionEl.value) return;
    const selectionBox = getBoundingBoxFitWithAspectRatio(
      {
        x: selection.x,
        y: selection.y,
        width: selection.width,
        height: selection.height,
      },
      aspectRatio
    );

    selectionEl.value.$change(
      selectionBox.x,
      selectionBox.y,
      selectionBox.width,
      selectionBox.height,
      aspectRatio
    );
  }
);

async function exportSelection() {
  return selectionEl.value?.$toCanvas();
}
async function resetImageAndSelection() {
  initImageAndSelection();
}
defineExpose({ exportSelection, resetImageAndSelection });
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
      rotatable="false"
      scalable="false"
      skewable="false"
      translatable="false"
    ></cropper-image>
    <cropper-shade hidden></cropper-shade>
    <cropper-handle action="select" plain></cropper-handle>
    <cropper-selection
      ref="selectionEl"
      initial-coverage="1"
      movable
      resizable
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
