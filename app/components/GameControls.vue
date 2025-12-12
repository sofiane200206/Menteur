<script setup lang="ts">
import type { CardType } from '~/types/game'
import { CARD_INFO } from '~/types/game'

const props = defineProps<{
  expectedType: CardType
  selectedCount: number
  disabled: boolean
  canChallenge: boolean
  isFirstPlay: boolean
}>()

// Nom de la carte attendue
const expectedCardName = computed(() => CARD_INFO[props.expectedType].name)

const emit = defineEmits<{
  play: []
  challenge: []
}>()
</script>

<template>
  <div class="game-controls">
    <!-- Annonce du type obligatoire -->
    <div class="rank-announcement">
      <div class="rank-label">
        <span v-if="isFirstPlay">🎯 Vous devez jouer des</span>
        <span v-else>🎯 Vous devez annoncer des</span>
      </div>
      <div class="rank-value">{{ expectedCardName }}</div>
      <div class="rank-hint">
        (Posez des cartes - vous pouvez mentir ! 🤫)
      </div>
    </div>

    <div class="action-buttons">
      <UButton
        color="primary"
        size="xl"
        icon="i-lucide-play"
        :disabled="disabled || selectedCount === 0"
        @click="emit('play')"
      >
        Jouer {{ selectedCount }} carte(s) comme "{{ expectedCardName }}"
      </UButton>
      
      <UButton
        v-if="canChallenge"
        color="error"
        variant="solid"
        size="xl"
        icon="i-lucide-alert-triangle"
        :disabled="disabled"
        @click="emit('challenge')"
      >
        🔍 MENTEUR !
      </UButton>
    </div>

    <p v-if="selectedCount === 0 && !disabled" class="help-text">
      👆 Sélectionnez des cartes dans votre main pour les jouer comme "{{ expectedCardName }}"
    </p>
    
    <p v-if="disabled && !canChallenge" class="wait-text">
      ⏳ Attendez votre tour...
    </p>
  </div>
</template>

<style scoped>
.game-controls {
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(139, 92, 246, 0.1));
  border: 2px solid rgba(59, 130, 246, 0.2);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  align-items: center;
}

.rank-announcement {
  text-align: center;
}

.rank-label {
  font-size: 18px;
  color: #6b7280;
  margin-bottom: 8px;
}

:root.dark .rank-label {
  color: #9ca3af;
}

.rank-value {
  font-size: 72px;
  font-weight: 800;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  line-height: 1;
  margin-bottom: 8px;
}

.rank-hint {
  font-size: 14px;
  color: #9ca3af;
}

.action-buttons {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  justify-content: center;
}

.help-text {
  font-size: 15px;
  color: #6b7280;
  text-align: center;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}

:root.dark .help-text {
  color: #9ca3af;
}

.wait-text {
  font-size: 15px;
  color: #f59e0b;
  text-align: center;
}
</style>
