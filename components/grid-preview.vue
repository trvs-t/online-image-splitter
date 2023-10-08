<script setup lang="ts">
defineProps<{
  grid: (typeof sizes.fbGrids)[number];
  innerClass?: string;
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
      class="absolute border border-primary pointer-events-none"
      :class="innerClass"
      :style="{
        left: section[0] * 100 + '%',
        top: section[1] * 100 + '%',
        width: section[2] * 100 + '%',
        height: section[3] * 100 + '%',
      }"
    ></div>
  </div>
</template>
