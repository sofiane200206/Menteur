<script setup lang="ts">
const emit = defineEmits<{
  start: [playerName: string, numPlayers: number]
}>()

const playerName = ref('')
const numPlayers = ref(3)

const playerOptions = [
  { label: '2 joueurs (1 IA)', value: 1 },
  { label: '3 joueurs (2 IA)', value: 2 },
  { label: '4 joueurs (3 IA)', value: 3 },
  { label: '5 joueurs (4 IA)', value: 4 }
]

function startGame() {
  emit('start', playerName.value || 'Joueur', numPlayers.value)
}
</script>

<template>
  <div class="setup-screen">
    <div class="setup-card">
      <div class="setup-header">
        <h1 class="setup-title">🃏 Le Menteur</h1>
        <p class="setup-subtitle">Aussi connu sous le nom de "Bullshit"</p>
      </div>

      <div class="rules-section">
        <h2 class="rules-title">📜 Règles du jeu</h2>
        <ul class="rules-list">
          <li>🎯 <strong>But :</strong> Se débarrasser de toutes ses cartes</li>
          <li>🃏 <strong>Tour :</strong> Jouez des cartes face cachée et annoncez leur rang</li>
          <li>🤥 <strong>Bluff :</strong> Vous pouvez mentir sur les cartes jouées !</li>
          <li>🔍 <strong>Challenge :</strong> Criez "MENTEUR !" si vous pensez qu'on vous ment</li>
          <li>⚠️ <strong>Punition :</strong> Le menteur (ou l'accusateur qui se trompe) récupère la pile</li>
        </ul>
      </div>

      <div class="setup-form">
        <UFormField label="Votre nom">
          <UInput 
            v-model="playerName" 
            placeholder="Entrez votre nom"
            icon="i-lucide-user"
            size="lg"
          />
        </UFormField>

        <UFormField label="Nombre de joueurs">
          <USelect 
            v-model="numPlayers" 
            :items="playerOptions"
            size="lg"
          />
        </UFormField>

        <UButton 
          color="primary" 
          size="xl" 
          block
          icon="i-lucide-play"
          @click="startGame"
        >
          🎮 Jouer en solo
        </UButton>

        <div class="divider">
          <span>ou</span>
        </div>

        <UButton 
          color="secondary" 
          variant="outline"
          size="xl" 
          block
          icon="i-lucide-globe"
          @click="$router.push('/online')"
        >
          🌐 Jouer en ligne
        </UButton>
      </div>
    </div>
  </div>
</template>

<style scoped>
.setup-screen {
  min-height: 80vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.setup-card {
  background: white;
  border-radius: 24px;
  padding: 40px;
  max-width: 500px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.1);
}

:root.dark .setup-card {
  background: #1f2937;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.setup-header {
  text-align: center;
  margin-bottom: 32px;
}

.setup-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin-bottom: 8px;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.setup-subtitle {
  color: #6b7280;
  font-size: 1.1rem;
}

:root.dark .setup-subtitle {
  color: #9ca3af;
}

.rules-section {
  background: rgba(59, 130, 246, 0.05);
  border-radius: 16px;
  padding: 20px;
  margin-bottom: 32px;
}

.rules-title {
  font-size: 1.2rem;
  font-weight: 600;
  margin-bottom: 12px;
}

.rules-list {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.rules-list li {
  font-size: 0.95rem;
  line-height: 1.5;
}

.setup-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.divider {
  display: flex;
  align-items: center;
  text-align: center;
  color: #6b7280;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

:root.dark .divider::before,
:root.dark .divider::after {
  background: #374151;
}

.divider span {
  padding: 0 12px;
  font-size: 14px;
}
</style>
