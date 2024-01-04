// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  devtools: { enabled: true },
  modules: ["@vueuse/nuxt", "@nuxt/ui"],
  ui: {
    icons: ["iconoir", "mdi"],
  },
  ssr: false,
  vite: {
    vue: {
      template: {
        compilerOptions: {
          isCustomElement: (tag) => tag.startsWith("cropper"),
        },
      },
    },
  },
});
