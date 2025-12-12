<script setup lang="ts">
import type { Card } from '~/types/game'
import { CARD_INFO, isJoker } from '~/types/game'

const props = defineProps<{
  card: Card
  selected?: boolean
  selectable?: boolean
  small?: boolean
}>()

const emit = defineEmits<{
  select: [card: Card]
}>()

// Obtenir les infos de la carte
const cardInfo = computed(() => CARD_INFO[props.card.type])
const isJokerCard = computed(() => isJoker(props.card.type))

function handleClick() {
  if (props.selectable) {
    emit('select', props.card)
  }
}
</script>

<template>
  <div
    class="game-card"
    :class="[
      card.faceUp ? 'face-up' : 'face-down',
      { 'selected': selected, 'selectable': selectable, 'small': small, 'joker': isJokerCard && card.faceUp }
    ]"
    @click="handleClick"
  >
    <template v-if="card.faceUp">
      <div class="card-content">
        <img 
          :src="cardInfo.image" 
          :alt="cardInfo.name"
          class="card-image"
        />
        <div class="card-name" :class="{ 'joker-name': isJokerCard }">
          {{ cardInfo.name }}
        </div>
        <div v-if="isJokerCard" class="joker-badge">
          🃏 JOKER
        </div>
      </div>
    </template>
    <template v-else>
      <div class="card-back">
        <div class="card-back-pattern">
          <span>🎴</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.game-card {
  width: 80px;
  height: 110px;
  border-radius: 8px;
  cursor: default;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
  overflow: hidden;
}

.game-card.small {
  width: 60px;
  height: 85px;
}

.game-card.face-up {
  background: white;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.game-card.face-up.joker {
  border: 3px solid #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.5);
}

.game-card.face-down {
  background: linear-gradient(135deg, #1e40af, #3b82f6);
  border: 2px solid #1e3a8a;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.game-card.selectable {
  cursor: pointer;
}

.game-card.selectable:hover {
  transform: translateY(-8px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.2);
}

.game-card.selected {
  transform: translateY(-12px);
  box-shadow: 0 12px 24px rgba(59, 130, 246, 0.4);
  border-color: #3b82f6;
}

.card-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

.card-image {
  width: 100%;
  height: 75%;
  object-fit: cover;
  border-radius: 6px 6px 0 0;
}

.card-name {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  font-size: 10px;
  font-weight: bold;
  text-align: center;
  padding: 4px 2px;
}

.small .card-name {
  font-size: 8px;
  padding: 2px;
}

.card-name.joker-name {
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: white;
}

.joker-badge {
  position: absolute;
  top: 4px;
  right: 4px;
  background: #f59e0b;
  color: white;
  font-size: 8px;
  font-weight: bold;
  padding: 2px 4px;
  border-radius: 4px;
}

.small .joker-badge {
  font-size: 6px;
  padding: 1px 2px;
  top: 2px;
  right: 2px;
}

.card-back {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: repeating-linear-gradient(
    45deg,
    transparent,
    transparent 5px,
    rgba(255, 255, 255, 0.1) 5px,
    rgba(255, 255, 255, 0.1) 10px
  );
}

.card-back-pattern {
  font-size: 24px;
  opacity: 0.8;
}

.small .card-back-pattern {
  font-size: 18px;
}

/* Dark mode */
:root.dark .game-card.face-up {
  background: #1f2937;
  border-color: #374151;
}

:root.dark .game-card.face-up.joker {
  border-color: #f59e0b;
}
</style>
