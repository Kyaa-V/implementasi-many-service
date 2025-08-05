// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  vite: {
    server: {
      watch: {
        usePolling: true,
        interval: 1000,
      },
      hmr: {
        protocol: 'ws',
        host: process.env.HMR_HOST || 'localhost',
        port: 3032
      }
    },
  }
})
  //   vue: {
  //     customElement: true
  //   },
  //   vueJsx: {
  //     mergeProps: true
  //   }
  // },
  // webpack: {
  //   loaders: {
  //     vue: {
  //       hotReload: true,
  //     }
  //   }
  // },
//})
