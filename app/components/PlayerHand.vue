<script setup lang="ts">
import type { Player, Card } from '~/types/game'

const props = defineProps<{
  player: Player
  isCurrentTurn: boolean
  canSelect: boolean
}>()

const emit = defineEmits<{
  selectCard: [card: Card]
}>()

const selectedCards = defineModel<string[]>('selectedCards', { default: () => [] })

function toggleCard(card: Card) {
  if (!props.canSelect) return
  
  const index = selectedCards.value.indexOf(card.id)
  if (index === -1) {
    selectedCards.value.push(card.id)
  } else {
    selectedCards.value.splice(index, 1)
  }
}

function isSelected(cardId: string): boolean {
  return selectedCards.value.includes(cardId)
}

// Trier les cartes par rang et couleur
const sortedCards = computed(() => {
  const rankOrder = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']
  const suitOrder = ['spades', 'hearts', 'diamonds', 'clubs']
  
  return [...props.player.cards].sort((a, b) => {
    const rankDiff = rankOrder.indexOf(a.rank) - rankOrder.indexOf(b.rank)
    if (rankDiff !== 0) return rankDiff
    return suitOrder.indexOf(a.suit) - suitOrder.indexOf(b.suit)
  })
})
</script>

<template>
  <div 
    class="player-hand"
    :class="{ 'current-turn': isCurrentTurn }"
  >
    <div class="player-info">
      <span class="player-name">{{ player.name }}</span>
      <UBadge 
        v-if="isCurrentTurn" 
        color="success" 
        variant="solid"
        size="sm"
      >
        À jouer
      </UBadge>
      <UBadge 
        color="neutral" 
        variant="subtle"
        size="sm"
      >
        {{ player.cards.length }} cartes
      </UBadge>
    </div>
    
    <div class="cards-container">
      <TransitionGroup name="card-list">
        <GameCard
          v-for="card in sortedCards"
          :key="card.id"
          :card="card"
          :selected="isSelected(card.id)"
          :selectable="canSelect && !player.isAI"
          @select="toggleCard"
        />
      </TransitionGroup>
    </div>
  </div>
</template>

<style scoped>
.player-hand {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 16px;
  padding: 16px;
  transition: all 0.3s ease;
}

:root.dark .player-hand {
  background: rgba(255, 255, 255, 0.05);
}

.player-hand.current-turn {
  background: rgba(59, 130, 246, 0.1);
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
}

.player-info {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.player-name {
  font-weight: 600;
  font-size: 16px;
}

.cards-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  min-height: 100px;
}

.card-list-enter-active,
.card-list-leave-active {
  transition: all 0.3s ease;
}

.card-list-enter-from {
  opacity: 0;
  transform: translateY(20px);
}

.card-list-leave-to {
  opacity: 0;
  transform: scale(0.8);
}
</style>
