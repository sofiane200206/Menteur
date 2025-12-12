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
      // URL du serveur WebSocket
      // En local: http://localhost:3001
      // En prod sur Render: laisser vide pour utiliser la même origine
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || ''
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
