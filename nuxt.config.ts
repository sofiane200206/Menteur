// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui'
  ],

  devtools: {
    enabled: true
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      // En prod sur Render, l'URL sera la même que le site (ex: https://liar.onrender.com)
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:3002'
    }
  },

  routeRules: {
    '/': { prerender: false } // Désactiver le prerender pour le jeu dynamique
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
