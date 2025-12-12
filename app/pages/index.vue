<script setup lang="ts">
import { getNextCardType } from '~/types/game'

const { gameState, startGame, playCards, challenge, resetGame, humanPlayer, isHumanTurn } = useGame()

// Cartes sélectionnées par le joueur
const selectedCards = ref<string[]>([])

// Type attendu pour le prochain coup
const expectedType = computed(() => {
  return getNextCardType(gameState.value.currentCardType)
})

// Est-ce le premier coup (pile vide) ?
const isFirstPlay = computed(() => {
  return gameState.value.pile.length === 0
})

// Adversaires (tous sauf le joueur humain)
const opponents = computed(() => {
  return gameState.value.players.filter(p => p.isAI)
})

// Position des adversaires
function getOpponentPosition(index: number): 'top' | 'left' | 'right' {
  const positions = ['top', 'left', 'right'] as const
  return positions[index % 3] ?? 'top'
}

// Jouer les cartes sélectionnées avec le type attendu automatiquement
function handlePlay() {
  if (selectedCards.value.length > 0) {
    playCards(selectedCards.value, expectedType.value)
    selectedCards.value = []
  }
}

// Challenger le dernier coup
function handleChallenge() {
  if (humanPlayer.value && gameState.value.canChallenge) {
    challenge(humanPlayer.value.id)
  }
}

// Démarrer une nouvelle partie
function handleStart(playerName: string, numPlayers: number) {
  startGame(playerName, numPlayers)
}

// Rejouer
function handlePlayAgain() {
  const name = humanPlayer.value?.name || 'Joueur'
  const numAI = opponents.value.length
  resetGame()
  setTimeout(() => startGame(name, numAI), 100)
}

// Quitter vers le menu
function handleQuit() {
  resetGame()
}

// Titre de la page
useHead({
  title: 'Le Menteur - Jeu de Cartes'
})
</script>

<template>
  <div class="game-page">
    <!-- Écran de configuration -->
    <GameSetup 
      v-if="gameState.gamePhase === 'setup'" 
      @start="handleStart"
    />

    <!-- Jeu en cours -->
    <template v-else>
      <!-- Message du jeu -->
      <div class="game-message">
        <UAlert 
          :color="gameState.gamePhase === 'challenge' ? 'warning' : 'info'"
          :title="gameState.message"
          icon="i-lucide-info"
        />
      </div>

      <!-- Zone de jeu principale -->
      <div class="game-layout">
        <!-- Adversaires en haut -->
        <div class="opponents-area">
          <OpponentHand
            v-for="(opponent, index) in opponents"
            :key="opponent.id"
            :player="opponent"
            :position="getOpponentPosition(index)"
            :is-current-turn="opponent.isCurrentTurn"
          />
        </div>

        <!-- Zone centrale avec la pile -->
        <div class="center-area">
          <CardPile 
            :pile="gameState.pile" 
            :last-play="gameState.lastPlay"
          />
        </div>

        <!-- Contrôles du joueur -->
        <div v-if="humanPlayer" class="controls-area">
          <GameControls
            :expected-type="expectedType"
            :selected-count="selectedCards.length"
            :disabled="!isHumanTurn || gameState.gamePhase !== 'playing'"
            :can-challenge="Boolean(gameState.canChallenge && isHumanTurn)"
            :is-first-play="isFirstPlay"
            @play="handlePlay"
            @challenge="handleChallenge"
          />
        </div>

        <!-- Main du joueur -->
        <div v-if="humanPlayer" class="player-area">
          <PlayerHand
            :player="humanPlayer"
            :is-current-turn="humanPlayer.isCurrentTurn"
            :can-select="Boolean(isHumanTurn && gameState.gamePhase === 'playing')"
            v-model:selected-cards="selectedCards"
          />
        </div>
      </div>

      <!-- Écran de fin de partie -->
      <GameOver
        v-if="gameState.gamePhase === 'gameOver'"
        :winner="gameState.winner"
        @play-again="handlePlayAgain"
        @quit="handleQuit"
      />
    </template>
  </div>
</template>

<style scoped>
.game-page {
  min-height: calc(100vh - 200px);
  padding: 20px;
}

.game-message {
  max-width: 600px;
  margin: 0 auto 20px;
}

.game-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.opponents-area {
  display: flex;
  justify-content: center;
  gap: 20px;
  flex-wrap: wrap;
}

.center-area {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.controls-area {
  max-width: 800px;
  margin: 0 auto;
  width: 100%;
}

.player-area {
  margin-top: auto;
}

/* Responsive */
@media (max-width: 768px) {
  .game-layout {
    gap: 16px;
  }
  
  .opponents-area {
    gap: 12px;
  }
}
</style>
