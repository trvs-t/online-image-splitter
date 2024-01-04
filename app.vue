<script setup lang="ts">
import type ImageCropper from "@/components/image-cropper.client.vue";
import type { TabItem } from "@nuxt/ui/dist/runtime/types";
import JSZip from "jszip";

const file = ref<File>();
const imgUrl = computed(() => file.value && URL.createObjectURL(file.value));
const imgAspectRatio = computedAsync(async () => {
  if (!file.value) return;
  const { width, height } = await getImageDimensions(imgUrl.value!);
  return width / height;
}, 16 / 9);
watch(imgUrl, (_, prev) => {
  if (prev) URL.revokeObjectURL(prev);
});
onUnmounted(() => {
  if (imgUrl.value) URL.revokeObjectURL(imgUrl.value);
});
function onDrop(files: File[]) {
  file.value = files[0];
}

const imageInput = ref<HTMLInputElement>();
function onSelectImageClick() {
  imageInput.value?.click();
}
function onInput(event: Event) {
  const files = (event.target as HTMLInputElement).files;
  if (!files) return;
  onDrop(Array.from(files));
}
const imageCropper = ref<InstanceType<typeof ImageCropper>>();

const { fbGrids, igGrids } = sizes;
const gridSelectIndexes = reactive({
  which: "fb",
  fb: 0,
  ig: 0,
});
const gridSelection = computed(() =>
  gridSelectIndexes.which === "fb"
    ? fbGrids[gridSelectIndexes.fb]
    : igGrids[gridSelectIndexes.ig]
);

function onTabChange(index: number) {
  gridSelectIndexes.which = index === 0 ? "ig" : "fb";
}

function resetImageTransform() {
  imageCropper.value?.resetImageAndSelection();
}

async function onSubmit() {
  const canvas = await imageCropper.value?.exportSelection();
  if (!canvas) return;

  const blobs: Blob[] = [];

  for (const box of gridSelection.value.boxes) {
    const tempCanvas = document.createElement("canvas");
    const context = tempCanvas.getContext("2d");
    if (!context) return;
    const [x, y, width, height] = box;
    tempCanvas.width = width * canvas.width;
    tempCanvas.height = height * canvas.height;
    context.drawImage(
      canvas,
      x * canvas.width,
      y * canvas.height,
      width * canvas.width,
      height * canvas.height,
      0,
      0,
      width * canvas.width,
      height * canvas.height
    );

    const blob = await new Promise<Blob>((resolve, reject) => {
      tempCanvas.toBlob((blob) => {
        if (!blob) return reject("Failed to convert canvas to blob");
        resolve(blob);
      });
    });

    blobs.push(blob);
  }

  const fileName = file.value?.name.split(".")[0] ?? "image";

  const zip = new JSZip();
  blobs.forEach((blob, i) => {
    zip.file(`${fileName}-${i}.png`, blob);
  });

  const content = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(content);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${fileName}.zip`;
  link.click();
}

const presetTabs: TabItem[] = [
  { label: "Facebook", slot: "fb", icon: "i-iconoir-facebook" },
  { label: "Instagram", slot: "ig", icon: "i-iconoir-instagram" },
];
</script>

<template>
  <div class="flex gap-6 p-10 h-screen items-center">
    <!-- Tailwind WTF? -->
    <div class="flex-1 text-center">
      <div class="grid grid-rows-1 grid-cols-1" style="aspect-ratio: 16/9">
        <div
          v-if="imgUrl"
          class="max-w-full max-h-full row-start-1 row-end-1 col-start-1 col-end-1 justify-self-center"
          :style="{
            aspectRatio: imgAspectRatio,
          }"
        >
          <ImageCropper
            :src="imgUrl"
            :selection-aspect-ratio="gridSelection['aspect-ratio']"
            :grid="gridSelection.boxes"
            ref="imageCropper"
          />
        </div>
        <div class="w-full h-full row-start-1 row-end-1 col-start-1 col-end-1">
          <Dropzone :show="!file" @drop="onDrop" />
        </div>
      </div>
      <input
        ref="imageInput"
        type="file"
        accept="image/*"
        hidden
        @change="onInput"
      />
      <div class="mt-4 flex justify-center gap-2" v-if="file">
        <UButton
          class="justify-center px-4"
          variant="soft"
          @click="onSelectImageClick"
          icon="i-iconoir-refresh"
        >
          Change Image
        </UButton>
        <UButton
          class="justify-center px-8"
          @click="onSubmit"
          size="xl"
          icon="i-iconoir-download"
          >Export</UButton
        >
      </div>
    </div>

    <div class="flex flex-col gap-4 w-60">
      <UTabs :items="presetTabs" @change="onTabChange">
        <template #default="{ item, index, selected }">
          <div class="flex items-center gap-2 relative truncate">
            <UIcon :name="item.icon" class="w-4 h-4 flex-shrink-0" />
            <span class="truncate">{{ item.label }}</span>
            <span
              v-if="selected"
              class="absolute -right-4 w-2 h-2 rounded-full bg-primary-500 dark:bg-primary-400"
            />
          </div>
        </template>
        <template #fb>
          <div
            class="grid grid-cols-3 content-start gap-2 h-60 overflow-y-auto"
          >
            <UButton
              style="aspect-ratio: 1"
              class="p-2"
              v-for="(grid, i) in fbGrids"
              :key="`grid-${i}`"
              @click="gridSelectIndexes.fb = i"
              :variant="gridSelectIndexes.fb === i ? 'solid' : 'outline'"
            >
              <GridPreview
                :grid="grid"
                :inner-class="
                  gridSelectIndexes.fb === i ? 'border-white' : 'border-primary'
                "
              />
            </UButton>
          </div>
        </template>
        <template #ig>
          <div
            class="grid grid-cols-3 content-start gap-2 h-60 overflow-y-auto"
          >
            <UButton
              style="aspect-ratio: 1"
              class="p-2"
              v-for="(grid, i) in igGrids"
              :key="`grid-${i}`"
              @click="gridSelectIndexes.ig = i"
              :variant="gridSelectIndexes.ig === i ? 'solid' : 'outline'"
            >
              <GridPreview
                :grid="grid"
                :inner-class="
                  gridSelectIndexes.ig === i ? 'border-white' : 'border-primary'
                "
              />
            </UButton>
          </div>
        </template>
      </UTabs>
      <UDivider />
      <div class="flex justify-end">
        <UTooltip text="Expand selection">
          <UButton
            variant="soft"
            @click="resetImageTransform"
            icon="i-mdi-arrow-expand"
          ></UButton>
        </UTooltip>
      </div>
    </div>
  </div>
</template>
