<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    show: boolean;
  }>(),
  { show: true }
);
const emit = defineEmits<{
  (e: "drop", files: File[]): void;
}>();

const fileInput = ref<HTMLInputElement>();
const dropzoneEl = ref<HTMLDivElement>();

function onDrop(files: File[] | null) {
  if (!files) return;
  emit("drop", files);
}
useDropZone(dropzoneEl, onDrop);

function onContainerClick() {
  if (!props.show) return;
  fileInput.value?.click();
}

function onInput(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;
  onDrop(Array.from(files));
}
</script>

<template>
  <div
    class="w-full h-full flex justify-center items-center cursor-pointer"
    ref="dropzoneEl"
    @click="onContainerClick"
  >
    <div
      class="w-1/2 h-1/2 border-2 border-dashed border-gray-400 rounded-lg flex justify-center items-center"
      :class="{ hidden: !show }"
    >
      <div class="text-center">
        <p class="text-2xl font-bold">Drop your image here</p>
        <p>or</p>
        <p class="font-normal">Select Image</p>
      </div>
    </div>
  </div>
  <input
    type="file"
    class="hidden"
    ref="fileInput"
    accept="image/*"
    @change="onInput"
  />
</template>
