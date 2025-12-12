<script setup lang="ts">
import type { Card } from '~/types/game'
import { SUIT_SYMBOLS, SUIT_COLORS } from '~/types/game'

const props = defineProps<{
  card: Card
  selected?: boolean
  selectable?: boolean
  small?: boolean
}>()

const emit = defineEmits<{
  select: [card: Card]
}>()

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
      { 'selected': selected, 'selectable': selectable, 'small': small }
    ]"
    @click="handleClick"
  >
    <template v-if="card.faceUp">
      <div class="card-content" :class="SUIT_COLORS[card.suit]">
        <div class="card-corner top-left">
          <span class="card-rank">{{ card.rank }}</span>
          <span class="card-suit">{{ SUIT_SYMBOLS[card.suit] }}</span>
        </div>
        <div class="card-center">
          <span class="card-suit-large">{{ SUIT_SYMBOLS[card.suit] }}</span>
        </div>
        <div class="card-corner bottom-right">
          <span class="card-rank">{{ card.rank }}</span>
          <span class="card-suit">{{ SUIT_SYMBOLS[card.suit] }}</span>
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
  width: 70px;
  height: 100px;
  border-radius: 8px;
  cursor: default;
  transition: all 0.2s ease;
  position: relative;
  flex-shrink: 0;
}

.game-card.small {
  width: 50px;
  height: 72px;
}

.game-card.face-up {
  background: white;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
  justify-content: space-between;
  padding: 4px;
  position: relative;
}

.card-corner {
  display: flex;
  flex-direction: column;
  align-items: center;
  line-height: 1;
}

.card-corner.top-left {
  align-self: flex-start;
}

.card-corner.bottom-right {
  align-self: flex-end;
  transform: rotate(180deg);
}

.card-rank {
  font-size: 14px;
  font-weight: bold;
}

.small .card-rank {
  font-size: 11px;
}

.card-suit {
  font-size: 12px;
}

.small .card-suit {
  font-size: 10px;
}

.card-center {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-suit-large {
  font-size: 28px;
}

.small .card-suit-large {
  font-size: 20px;
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
</style>
