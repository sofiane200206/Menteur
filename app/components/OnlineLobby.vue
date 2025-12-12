<script setup lang="ts">
const {
  isConnected,
  room,
  error,
  isHost,
  createRoom,
  joinRoom,
  toggleReady,
  startGame,
  leaveRoom
} = useMultiplayer()

const emit = defineEmits<{
  gameStarted: []
}>()

const mode = ref<'menu' | 'create' | 'join'>('menu')
const playerName = ref('')
const roomName = ref('')
const roomCode = ref('')
const maxPlayers = ref(4)

function handleCreate() {
  if (!playerName.value.trim()) return
  createRoom(playerName.value.trim(), roomName.value.trim() || `Partie de ${playerName.value}`, maxPlayers.value)
}

function handleJoin() {
  if (!playerName.value.trim() || !roomCode.value.trim()) return
  joinRoom(playerName.value.trim(), roomCode.value.trim())
}

function handleStart() {
  startGame()
}

function handleLeave() {
  leaveRoom()
  mode.value = 'menu'
}

function copyRoomCode() {
  if (room.value) {
    navigator.clipboard.writeText(room.value.id)
  }
}

// Tous les joueurs prêts ?
const allReady = computed(() => {
  if (!room.value) return false
  return room.value.players.every(p => p.isReady || p.isHost)
})

const canStart = computed(() => {
  return isHost.value && room.value && room.value.players.length >= 2 && allReady.value
})
</script>

<template>
  <div class="lobby">
    <!-- Status connexion -->
    <div class="connection-status">
      <UBadge :color="isConnected ? 'success' : 'error'" variant="subtle">
        {{ isConnected ? '🟢 Connecté' : '🔴 Déconnecté' }}
      </UBadge>
    </div>

    <!-- Erreur -->
    <UAlert v-if="error" color="error" :title="error" class="mb-4" />

    <!-- Menu principal -->
    <template v-if="!room">
      <div v-if="mode === 'menu'" class="menu-screen">
        <div class="menu-header">
          <h1 class="menu-title">🃏 Le Menteur</h1>
          <p class="menu-subtitle">Multijoueur en ligne</p>
        </div>

        <div class="menu-buttons">
          <UButton
            color="primary"
            size="xl"
            icon="i-lucide-plus"
            block
            @click="mode = 'create'"
          >
            Créer une partie
          </UButton>
          
          <UButton
            color="neutral"
            variant="outline"
            size="xl"
            icon="i-lucide-log-in"
            block
            @click="mode = 'join'"
          >
            Rejoindre une partie
          </UButton>
        </div>
      </div>

      <!-- Créer une partie -->
      <div v-else-if="mode === 'create'" class="form-screen">
        <h2 class="form-title">Créer une partie</h2>

        <div class="form-fields">
          <UFormField label="Votre pseudo">
            <UInput
              v-model="playerName"
              placeholder="Entrez votre pseudo"
              icon="i-lucide-user"
              size="lg"
            />
          </UFormField>

          <UFormField label="Nom de la partie (optionnel)">
            <UInput
              v-model="roomName"
              placeholder="Ma super partie"
              icon="i-lucide-home"
              size="lg"
            />
          </UFormField>

          <UFormField label="Nombre de joueurs max">
            <USelect
              v-model="maxPlayers"
              :items="[
                { label: '2 joueurs', value: 2 },
                { label: '3 joueurs', value: 3 },
                { label: '4 joueurs', value: 4 },
                { label: '5 joueurs', value: 5 },
                { label: '6 joueurs', value: 6 }
              ]"
              size="lg"
            />
          </UFormField>
        </div>

        <div class="form-actions">
          <UButton
            color="neutral"
            variant="ghost"
            @click="mode = 'menu'"
          >
            Retour
          </UButton>
          <UButton
            color="primary"
            :disabled="!playerName.trim()"
            @click="handleCreate"
          >
            Créer
          </UButton>
        </div>
      </div>

      <!-- Rejoindre une partie -->
      <div v-else-if="mode === 'join'" class="form-screen">
        <h2 class="form-title">Rejoindre une partie</h2>

        <div class="form-fields">
          <UFormField label="Votre pseudo">
            <UInput
              v-model="playerName"
              placeholder="Entrez votre pseudo"
              icon="i-lucide-user"
              size="lg"
            />
          </UFormField>

          <UFormField label="Code de la partie">
            <UInput
              v-model="roomCode"
              placeholder="ABC123"
              icon="i-lucide-key"
              size="lg"
              class="uppercase"
            />
          </UFormField>
        </div>

        <div class="form-actions">
          <UButton
            color="neutral"
            variant="ghost"
            @click="mode = 'menu'"
          >
            Retour
          </UButton>
          <UButton
            color="primary"
            :disabled="!playerName.trim() || !roomCode.trim()"
            @click="handleJoin"
          >
            Rejoindre
          </UButton>
        </div>
      </div>
    </template>

    <!-- Salle d'attente -->
    <template v-else>
      <div class="waiting-room">
        <div class="room-header">
          <h2 class="room-name">{{ room.name }}</h2>
          <div class="room-code" @click="copyRoomCode">
            <span>Code :</span>
            <strong>{{ room.id }}</strong>
            <UIcon name="i-lucide-copy" class="copy-icon" />
          </div>
        </div>

        <div class="players-list">
          <h3>Joueurs ({{ room.players.length }}/{{ room.maxPlayers }})</h3>
          <div
            v-for="player in room.players"
            :key="player.id"
            class="player-item"
            :class="{ 'is-me': player.socketId === $socket?.id }"
          >
            <div class="player-info">
              <UIcon 
                :name="player.isHost ? 'i-lucide-crown' : 'i-lucide-user'" 
                :class="{ 'text-yellow-500': player.isHost }"
              />
              <span class="player-name">{{ player.name }}</span>
              <UBadge v-if="player.isHost" color="warning" variant="subtle" size="xs">
                Hôte
              </UBadge>
            </div>
            <UBadge 
              :color="player.isReady || player.isHost ? 'success' : 'neutral'" 
              :variant="player.isReady || player.isHost ? 'solid' : 'outline'"
              size="sm"
            >
              {{ player.isReady || player.isHost ? '✓ Prêt' : 'En attente' }}
            </UBadge>
          </div>
        </div>

        <div class="room-actions">
          <UButton
            v-if="!isHost"
            :color="room.players.find(p => p.socketId === $socket?.id)?.isReady ? 'success' : 'primary'"
            size="lg"
            @click="toggleReady"
          >
            {{ room.players.find(p => p.socketId === $socket?.id)?.isReady ? '✓ Prêt !' : 'Je suis prêt' }}
          </UButton>

          <UButton
            v-if="isHost"
            color="primary"
            size="lg"
            :disabled="!canStart"
            @click="handleStart"
          >
            🎮 Lancer la partie
          </UButton>

          <UButton
            color="error"
            variant="ghost"
            @click="handleLeave"
          >
            Quitter
          </UButton>
        </div>

        <p v-if="isHost && !canStart" class="waiting-hint">
          <template v-if="room.players.length < 2">
            En attente de joueurs... Partagez le code <strong>{{ room.id }}</strong>
          </template>
          <template v-else-if="!allReady">
            En attente que tous les joueurs soient prêts...
          </template>
        </p>
      </div>
    </template>
  </div>
</template>

<style scoped>
.lobby {
  max-width: 500px;
  margin: 0 auto;
  padding: 20px;
}

.connection-status {
  text-align: center;
  margin-bottom: 20px;
}

.menu-screen {
  text-align: center;
}

.menu-header {
  margin-bottom: 40px;
}

.menu-title {
  font-size: 3rem;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 8px;
}

.menu-subtitle {
  color: #6b7280;
  font-size: 1.2rem;
}

.menu-buttons {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.form-screen {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

:root.dark .form-screen {
  background: #1f2937;
}

.form-title {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 24px;
  text-align: center;
}

.form-fields {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 24px;
}

.form-actions {
  display: flex;
  justify-content: space-between;
}

.uppercase :deep(input) {
  text-transform: uppercase;
}

.waiting-room {
  background: white;
  border-radius: 16px;
  padding: 32px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

:root.dark .waiting-room {
  background: #1f2937;
}

.room-header {
  text-align: center;
  margin-bottom: 24px;
}

.room-name {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.room-code {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: rgba(59, 130, 246, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.room-code:hover {
  background: rgba(59, 130, 246, 0.2);
}

.room-code strong {
  font-size: 1.2rem;
  letter-spacing: 2px;
  color: #3b82f6;
}

.copy-icon {
  width: 16px;
  height: 16px;
  opacity: 0.5;
}

.players-list {
  margin-bottom: 24px;
}

.players-list h3 {
  font-size: 0.9rem;
  color: #6b7280;
  margin-bottom: 12px;
}

.player-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 8px;
  margin-bottom: 8px;
}

:root.dark .player-item {
  background: rgba(255, 255, 255, 0.05);
}

.player-item.is-me {
  background: rgba(59, 130, 246, 0.1);
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.player-name {
  font-weight: 500;
}

.room-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.waiting-hint {
  text-align: center;
  color: #6b7280;
  font-size: 0.9rem;
  margin-top: 16px;
}

.waiting-hint strong {
  color: #3b82f6;
}
</style>
