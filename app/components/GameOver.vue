<script setup lang="ts">
import type { Player } from '~/types/game'

const props = defineProps<{
  winner: Player | null
}>()

const emit = defineEmits<{
  playAgain: []
  quit: []
}>()

const confetti = ref<{ x: number; y: number; color: string; rotation: number }[]>([])

onMounted(() => {
  // Créer des confettis
  for (let i = 0; i < 50; i++) {
    confetti.value.push({
      x: Math.random() * 100,
      y: Math.random() * 100,
      color: ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981'][Math.floor(Math.random() * 5)],
      rotation: Math.random() * 360
    })
  }
})
</script>

<template>
  <div class="game-over-overlay">
    <div class="confetti-container">
      <div 
        v-for="(c, i) in confetti" 
        :key="i"
        class="confetti"
        :style="{
          left: c.x + '%',
          top: c.y + '%',
          backgroundColor: c.color,
          transform: `rotate(${c.rotation}deg)`,
          animationDelay: `${Math.random() * 2}s`
        }"
      />
    </div>
    
    <div class="game-over-card">
      <div class="trophy">🏆</div>
      
      <h1 class="winner-title">
        {{ winner?.isAI ? 'Défaite !' : 'Victoire !' }}
      </h1>
      
      <p class="winner-name">
        {{ winner?.name }} a gagné !
      </p>
      
      <p v-if="winner?.isAI" class="message lose">
        L'IA était plus maligne cette fois... 🤖
      </p>
      <p v-else class="message win">
        Félicitations ! Vous êtes le champion du bluff ! 🎉
      </p>

      <div class="actions">
        <UButton 
          color="primary" 
          size="xl"
          icon="i-lucide-refresh-cw"
          @click="emit('playAgain')"
        >
          Rejouer
        </UButton>
        
        <UButton 
          color="neutral" 
          variant="outline"
          size="xl"
          icon="i-lucide-home"
          @click="emit('quit')"
        >
          Menu principal
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.game-over-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.confetti-container {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.confetti {
  position: absolute;
  width: 10px;
  height: 10px;
  border-radius: 2px;
  animation: fall 3s linear infinite;
}

@keyframes fall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(720deg);
    opacity: 0;
  }
}

.game-over-card {
  background: white;
  border-radius: 24px;
  padding: 48px;
  text-align: center;
  max-width: 400px;
  width: 90%;
  animation: slideUp 0.5s ease 0.2s both;
  position: relative;
  z-index: 1;
}

:root.dark .game-over-card {
  background: #1f2937;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.trophy {
  font-size: 5rem;
  margin-bottom: 16px;
  animation: bounce 1s ease infinite;
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

.winner-title {
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 8px;
}

.winner-name {
  font-size: 1.25rem;
  color: #6b7280;
  margin-bottom: 16px;
}

:root.dark .winner-name {
  color: #9ca3af;
}

.message {
  font-size: 1rem;
  margin-bottom: 32px;
  padding: 12px 20px;
  border-radius: 12px;
}

.message.win {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.message.lose {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
}
</style>
