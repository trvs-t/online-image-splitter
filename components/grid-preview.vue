<script setup lang="ts">
defineProps<{
  grid: (typeof sizes.fbGrids)[number];
}>();
</script>
<template>
  <div
    class="w-full relative"
    :style="{ 'aspect-ratio': grid['aspect-ratio'] }"
  >
    <div
      v-for="(section, i) in grid.boxes"
      :key="`section-${i}`"
      :style="{
        position: 'absolute',
        left: section[0] * 100 + '%',
        top: section[1] * 100 + '%',
        width: section[2] * 100 + '%',
        height: section[3] * 100 + '%',
        border: '1px solid white',
        pointerEvents: 'none',
      }"
    ></div>
  </div>
</template>
