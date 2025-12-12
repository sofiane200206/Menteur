<script setup lang="ts">
import type { Player, Card } from '~/types/game'

const props = defineProps<{
  player: Player
  position: 'top' | 'left' | 'right'
  isCurrentTurn: boolean
}>()

// Limiter l'affichage des cartes pour les adversaires
const displayedCards = computed(() => {
  return props.player.cards.slice(0, 10)
})

const hasMoreCards = computed(() => {
  return props.player.cards.length > 10
})
</script>

<template>
  <div 
    class="opponent-hand"
    :class="[position, { 'current-turn': isCurrentTurn }]"
  >
    <div class="opponent-info">
      <span class="opponent-name">{{ player.name }}</span>
      <UBadge 
        v-if="isCurrentTurn" 
        color="warning" 
        variant="solid"
        size="xs"
      >
        Joue...
      </UBadge>
      <UBadge 
        color="neutral" 
        variant="subtle"
        size="xs"
      >
        {{ player.cards.length }}
      </UBadge>
    </div>
    
    <div class="cards-fan">
      <div 
        v-for="(card, index) in displayedCards" 
        :key="card.id"
        class="opponent-card"
        :style="{ '--index': index, '--total': displayedCards.length }"
      >
        <GameCard :card="{ ...card, faceUp: false }" small />
      </div>
      <div v-if="hasMoreCards" class="more-cards">
        +{{ player.cards.length - 10 }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.opponent-hand {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: rgba(0, 0, 0, 0.03);
  border-radius: 12px;
  transition: all 0.3s ease;
}

:root.dark .opponent-hand {
  background: rgba(255, 255, 255, 0.03);
}

.opponent-hand.current-turn {
  background: rgba(234, 179, 8, 0.15);
  box-shadow: 0 0 15px rgba(234, 179, 8, 0.3);
}

.opponent-info {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.opponent-name {
  font-weight: 600;
  font-size: 14px;
}

.cards-fan {
  display: flex;
  position: relative;
  height: 80px;
  min-width: 100px;
}

.opponent-card {
  position: absolute;
  left: calc(var(--index) * 15px);
  transition: transform 0.2s ease;
}

.opponent-card:hover {
  transform: translateY(-4px);
  z-index: 10;
}

.more-cards {
  position: absolute;
  right: -30px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 12px;
  font-weight: bold;
  color: #6b7280;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 6px;
  border-radius: 4px;
}

:root.dark .more-cards {
  background: rgba(255, 255, 255, 0.1);
  color: #9ca3af;
}

/* Positions */
.opponent-hand.top {
  transform: none;
}

.opponent-hand.left,
.opponent-hand.right {
  min-width: 120px;
}
</style>
