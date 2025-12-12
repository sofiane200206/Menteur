<script setup lang="ts">
const {
  isConnected,
  room,
  gameState,
  connect,
  leaveRoom
} = useMultiplayer()

// Vue actuelle
const view = computed(() => {
  if (gameState.value && gameState.value.gamePhase !== 'waiting') {
    return 'game'
  }
  return 'lobby'
})

// Se connecter au serveur
onMounted(() => {
  connect()
})

// Quitter la partie
function handleLeave() {
  leaveRoom()
  navigateTo('/')
}
</script>

<template>
  <div class="online-page">
    <!-- Header -->
    <header class="online-header">
      <NuxtLink to="/" class="back-link">
        <UIcon name="i-lucide-arrow-left" />
        Retour
      </NuxtLink>
      <h1 class="title">🃏 Menteur en ligne</h1>
      <div class="connection-status">
        <UBadge :color="isConnected ? 'success' : 'error'">
          {{ isConnected ? '🟢 Connecté' : '🔴 Déconnecté' }}
        </UBadge>
      </div>
    </header>

    <!-- Contenu -->
    <main class="online-content">
      <OnlineLobby v-if="view === 'lobby'" />
      <OnlineGame v-else @leave="handleLeave" />
    </main>
  </div>
</template>

<style scoped>
.online-page {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.online-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.05);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

:root.dark .online-header {
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.back-link {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #3b82f6;
  font-weight: 500;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.title {
  font-size: 24px;
  font-weight: 700;
}

.online-content {
  flex: 1;
  padding: 24px;
}
</style>
