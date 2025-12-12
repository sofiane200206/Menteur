<script setup lang="ts">
import type { Rank } from '~/types/game'

const {
  gameState,
  myCards,
  myId,
  error,
  isMyTurn,
  expectedRank,
  playCards,
  challenge,
  leaveRoom
} = useMultiplayer()

const emit = defineEmits<{
  leave: []
}>()

// Cartes sélectionnées
const selectedCards = ref<string[]>([])

// Jouer les cartes
function handlePlay() {
  if (selectedCards.value.length > 0 && gameState.value) {
    playCards(selectedCards.value, expectedRank.value)
    selectedCards.value = []
  }
}

// Challenger
function handleChallenge() {
  challenge()
}

// Toggle sélection d'une carte
function toggleCard(cardId: string) {
  const index = selectedCards.value.indexOf(cardId)
  if (index === -1) {
    selectedCards.value.push(cardId)
  } else {
    selectedCards.value.splice(index, 1)
  }
}

// Trier les cartes
const sortedCards = computed(() => {
  const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs']
  
  return [...myCards.value].sort((a, b) => {
    const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
    if (rankDiff !== 0) return rankDiff
    return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
  })
})

// Trouver le gagnant
const winner = computed(() => {
  if (!gameState.value?.winnerId) return null
  return gameState.value.players.find(p => p.id === gameState.value!.winnerId)
})
</script>

<template>
  <div v-if="gameState" class="online-game">
    <!-- Erreur -->
    <UAlert v-if="error" color="error" :title="error" class="mb-4" />

    <!-- Message du jeu -->
    <div class="game-message">
      <UAlert
        :color="gameState.gamePhase === 'challenge' ? 'warning' : 'info'"
        :title="gameState.message"
        icon="i-lucide-info"
      />
    </div>

    <!-- Adversaires -->
    <div class="opponents-area">
      <div
        v-for="player in gameState.players.filter(p => p.id !== myId)"
        :key="player.id"
        class="opponent"
        :class="{ 'current-turn': player.isCurrentTurn, 'disconnected': !player.isConnected }"
      >
        <div class="opponent-info">
          <UIcon :name="player.isConnected ? 'i-lucide-user' : 'i-lucide-user-x'" />
          <span class="opponent-name">{{ player.name }}</span>
          <UBadge v-if="player.isCurrentTurn" color="warning" size="xs">Joue...</UBadge>
        </div>
        <div class="opponent-cards">
          <div v-for="i in Math.min(player.cardCount, 8)" :key="i" class="mini-card" />
          <span v-if="player.cardCount > 8" class="more-cards">+{{ player.cardCount - 8 }}</span>
        </div>
        <UBadge color="neutral" size="xs">{{ player.cardCount }} cartes</UBadge>
      </div>
    </div>

    <!-- Pile centrale -->
    <div class="pile-area">
      <div class="pile-container">
        <div v-if="gameState.pileCount === 0" class="empty-pile">
          <UIcon name="i-lucide-circle-dashed" class="text-4xl opacity-30" />
          <span>Pile vide</span>
        </div>
        <template v-else>
          <!-- Cartes du dernier coup -->
          <div v-if="gameState.lastPlay" class="last-played">
            <div
              v-for="(card, index) in (gameState.lastPlay.cards || [])"
              :key="index"
              class="played-card"
            >
              <GameCard v-if="card.faceUp" :card="card" />
              <div v-else class="card-back">🎴</div>
            </div>
            <div v-if="!gameState.lastPlay.cards" class="card-count">
              {{ gameState.lastPlay.cardCount }} carte(s)
            </div>
          </div>
        </template>
      </div>
      
      <div class="pile-info">
        <UBadge color="neutral">{{ gameState.pileCount }} cartes dans la pile</UBadge>
        <div v-if="gameState.lastPlay" class="last-play-text">
          Annoncé : <strong>{{ gameState.lastPlay.cardCount }}x {{ gameState.lastPlay.claimedRank }}</strong>
        </div>
      </div>
    </div>

    <!-- Contrôles -->
    <div class="controls-area">
      <div class="rank-announcement">
        <span class="rank-label">Rang à annoncer :</span>
        <span class="rank-value">{{ expectedRank }}</span>
      </div>

      <div class="action-buttons">
        <UButton
          color="primary"
          size="xl"
          :disabled="!isMyTurn || selectedCards.length === 0 || gameState.gamePhase !== 'playing'"
          @click="handlePlay"
        >
          Jouer {{ selectedCards.length }} carte(s) comme "{{ expectedRank }}"
        </UButton>

        <UButton
          v-if="gameState.canChallenge && isMyTurn"
          color="error"
          size="xl"
          @click="handleChallenge"
        >
          🔍 MENTEUR !
        </UButton>
      </div>

      <p v-if="!isMyTurn" class="wait-text">⏳ Attendez votre tour...</p>
    </div>

    <!-- Ma main -->
    <div class="my-hand">
      <h3>Ma main ({{ myCards.length }} cartes)</h3>
      <div class="cards-container">
        <div
          v-for="card in sortedCards"
          :key="card.id"
          class="card-wrapper"
          :class="{ selected: selectedCards.includes(card.id) }"
          @click="isMyTurn && gameState.gamePhase === 'playing' && toggleCard(card.id)"
        >
          <GameCard :card="card" :selectable="isMyTurn && gameState.gamePhase === 'playing'" />
        </div>
      </div>
    </div>

    <!-- Écran de fin -->
    <div v-if="gameState.gamePhase === 'gameOver'" class="game-over-overlay">
      <div class="game-over-card">
        <div class="trophy">🏆</div>
        <h1>{{ winner?.id === myId ? 'Victoire !' : 'Défaite !' }}</h1>
        <p>{{ winner?.name }} a gagné !</p>
        <UButton color="primary" size="xl" @click="emit('leave')">
          Retour au lobby
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.online-game {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.game-message {
  max-width: 600px;
  margin: 0 auto 20px;
}

.opponents-area {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.opponent {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  min-width: 150px;
}

:root.dark .opponent {
  background: rgba(255, 255, 255, 0.05);
}

.opponent.current-turn {
  background: rgba(234, 179, 8, 0.15);
  box-shadow: 0 0 15px rgba(234, 179, 8, 0.3);
}

.opponent.disconnected {
  opacity: 0.5;
}

.opponent-info {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 8px;
}

.opponent-name {
  font-weight: 600;
}

.opponent-cards {
  display: flex;
  justify-content: center;
  gap: 2px;
  margin-bottom: 8px;
}

.mini-card {
  width: 20px;
  height: 28px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  border-radius: 3px;
  margin-left: -8px;
}

.mini-card:first-child {
  margin-left: 0;
}

.more-cards {
  font-size: 12px;
  color: #6b7280;
  margin-left: 4px;
}

.pile-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.pile-container {
  min-width: 200px;
  min-height: 120px;
  background: rgba(34, 197, 94, 0.1);
  border: 2px dashed rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.empty-pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
}

.last-played {
  display: flex;
  gap: 8px;
}

.played-card .card-back {
  width: 60px;
  height: 84px;
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
}

.card-count {
  font-size: 18px;
  font-weight: bold;
  color: #3b82f6;
}

.pile-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.last-play-text strong {
  color: #3b82f6;
}

.controls-area {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border-radius: 16px;
  padding: 24px;
  margin-bottom: 24px;
  text-align: center;
}

.rank-announcement {
  margin-bottom: 16px;
}

.rank-label {
  color: #6b7280;
}

.rank-value {
  font-size: 48px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-left: 12px;
}

.action-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  flex-wrap: wrap;
}

.wait-text {
  color: #f59e0b;
  margin-top: 12px;
}

.my-hand {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  padding: 20px;
}

:root.dark .my-hand {
  background: rgba(255, 255, 255, 0.05);
}

.my-hand h3 {
  margin-bottom: 12px;
  font-weight: 600;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.card-wrapper {
  cursor: pointer;
  transition: transform 0.2s;
}

.card-wrapper:hover {
  transform: translateY(-8px);
}

.card-wrapper.selected {
  transform: translateY(-16px);
}

.card-wrapper.selected::after {
  content: '';
  position: absolute;
  inset: -4px;
  border: 2px solid #3b82f6;
  border-radius: 10px;
}

.game-over-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}

.game-over-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  text-align: center;
}

:root.dark .game-over-card {
  background: #1f2937;
}

.trophy {
  font-size: 80px;
  margin-bottom: 16px;
}
</style>
