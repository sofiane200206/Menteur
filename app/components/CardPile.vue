<script setup lang="ts">
import type { Card, PlayedCards } from '~/types/game'
import { CARD_INFO } from '~/types/game'

const props = defineProps<{
  pile: Card[]
  lastPlay: PlayedCards | null
}>()

// Obtenir le nom de la carte annoncée
const claimedCardName = computed(() => {
  if (!props.lastPlay) return ''
  return CARD_INFO[props.lastPlay.claimedType].name
})

// Cartes de l'ancien pile (sans le dernier coup)
const oldPileCards = computed(() => {
  if (!props.lastPlay) return props.pile.slice(-5)
  const lastPlayIds = new Set(props.lastPlay.cards.map(c => c.id))
  return props.pile.filter(c => !lastPlayIds.has(c.id)).slice(-3)
})

// Cartes du dernier coup joué
const lastPlayedCards = computed(() => {
  return props.lastPlay?.cards ?? []
})
</script>

<template>
  <div class="pile-area">
    <div class="pile-label">
      <UIcon name="i-lucide-layers" />
      <span>Pile centrale</span>
      <UBadge color="neutral" variant="outline" size="sm">
        {{ pile.length }} cartes
      </UBadge>
    </div>
    
    <div class="pile-container">
      <div v-if="pile.length === 0" class="empty-pile">
        <UIcon name="i-lucide-circle-dashed" class="text-4xl opacity-30" />
        <span>Pile vide</span>
      </div>
      
      <template v-else>
        <!-- Anciennes cartes en arrière-plan -->
        <div class="old-pile-cards">
          <div 
            v-for="(card, index) in oldPileCards" 
            :key="card.id"
            class="pile-card old"
            :style="{ 
              '--index': index,
              '--rotation': ((index * 15) - 20) + 'deg',
              '--offset-x': ((index - 1) * 8) + 'px'
            }"
          >
            <GameCard :card="{ ...card, faceUp: false }" small />
          </div>
        </div>
        
        <!-- Dernières cartes jouées - bien visibles -->
        <div v-if="lastPlayedCards.length > 0" class="last-played-cards">
          <div 
            v-for="(card, index) in lastPlayedCards" 
            :key="card.id"
            class="last-card"
            :style="{ 
              '--index': index,
              '--total': lastPlayedCards.length
            }"
          >
            <GameCard :card="card" />
          </div>
        </div>
      </template>
    </div>
    
    <div v-if="lastPlay" class="last-play-info">
      <span class="last-play-text">
        Dernier coup : <strong>{{ lastPlay.cards.length }} carte(s) annoncée(s) "{{ claimedCardName }}"</strong>
      </span>
    </div>
  </div>
</template>

<style scoped>
.pile-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.pile-label {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: #6b7280;
}

:root.dark .pile-label {
  color: #9ca3af;
}

.pile-container {
  min-width: 280px;
  min-height: 160px;
  padding: 20px;
  background: rgba(34, 197, 94, 0.1);
  border: 2px dashed rgba(34, 197, 94, 0.3);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.empty-pile {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  color: #6b7280;
  font-size: 14px;
}

:root.dark .empty-pile {
  color: #9ca3af;
}

/* Anciennes cartes en arrière-plan */
.old-pile-cards {
  position: absolute;
  left: 20px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
}

.pile-card.old {
  position: relative;
  margin-left: -30px;
  transform: rotate(var(--rotation));
  opacity: 0.6;
  z-index: var(--index);
}

.pile-card.old:first-child {
  margin-left: 0;
}

/* Dernières cartes jouées - bien visibles */
.last-played-cards {
  display: flex;
  gap: 8px;
  justify-content: center;
  z-index: 10;
}

.last-card {
  transform: rotate(calc((var(--index) - var(--total) / 2 + 0.5) * 5deg));
  transition: transform 0.3s ease;
  animation: cardAppear 0.4s ease-out;
}

.last-card:hover {
  transform: rotate(0deg) translateY(-5px);
  z-index: 20;
}

@keyframes cardAppear {
  from {
    opacity: 0;
    transform: translateY(-30px) rotate(calc((var(--index) - var(--total) / 2 + 0.5) * 5deg));
  }
  to {
    opacity: 1;
    transform: translateY(0) rotate(calc((var(--index) - var(--total) / 2 + 0.5) * 5deg));
  }
}

.last-play-info {
  background: rgba(59, 130, 246, 0.1);
  padding: 8px 16px;
  border-radius: 8px;
  font-size: 14px;
}

.last-play-text strong {
  color: #3b82f6;
}
</style>
