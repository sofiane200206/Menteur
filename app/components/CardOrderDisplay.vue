<script setup lang="ts">
import { ALL_CARDS, CARD_INFO, CARD_ORDER, JOKER_CARD } from '~/types/game'

const showModal = ref(false)
</script>

<template>
  <div>
    <!-- Bouton pour ouvrir le modal -->
    <UButton 
      color="secondary" 
      variant="soft"
      size="sm"
      icon="i-lucide-eye"
      @click="showModal = true"
    >
      Voir l'ordre des cartes
    </UButton>

    <!-- Modal avec l'ordre des cartes -->
    <UModal v-model:open="showModal">
      <template #content>
        <div class="card-order-modal">
          <div class="modal-header">
            <h2 class="modal-title">🃏 Ordre des Cartes</h2>
            <p class="modal-subtitle">Du plus faible au plus fort</p>
          </div>

          <!-- Cartes principales dans l'ordre -->
          <div class="cards-section">
            <h3 class="section-title">📊 Cartes Principales (dans l'ordre)</h3>
            <div class="cards-grid">
              <div 
                v-for="(cardType, index) in CARD_ORDER" 
                :key="cardType"
                class="card-item"
              >
                <div class="card-rank-number">{{ index + 1 }}</div>
                <div class="card-preview">
                  <img 
                    :src="CARD_INFO[cardType].image" 
                    :alt="CARD_INFO[cardType].name"
                    class="card-image"
                  />
                </div>
                <div class="card-label">{{ CARD_INFO[cardType].name }}</div>
              </div>
            </div>
          </div>

          <!-- Le Joker -->
          <div class="joker-section">
            <h3 class="section-title">🃏 Le Joker (Carte Spéciale)</h3>
            <div class="joker-container">
              <div class="joker-card">
                <div class="joker-preview">
                  <img 
                    :src="CARD_INFO[JOKER_CARD].image" 
                    :alt="CARD_INFO[JOKER_CARD].name"
                    class="joker-image"
                  />
                </div>
                <div class="joker-label">{{ CARD_INFO[JOKER_CARD].name }}</div>
              </div>
              <div class="joker-rules">
                <UAlert 
                  color="warning"
                  title="⚠️ Règle du Joker"
                  icon="i-lucide-alert-triangle"
                >
                  <template #description>
                    <ul class="joker-rules-list">
                      <li>🚫 Le Joker (Peto) ne peut <strong>JAMAIS</strong> être joué légalement</li>
                      <li>🤥 Tu <strong>DOIS mentir</strong> pour le poser sur la pile</li>
                      <li>😱 Si quelqu'un crie "Menteur!" quand tu poses un Joker, tu récupères la pile !</li>
                      <li>🎯 C'est une carte à risque mais qui peut te permettre de te débarrasser de cartes</li>
                    </ul>
                  </template>
                </UAlert>
              </div>
            </div>
          </div>

          <div class="modal-footer">
            <UButton 
              color="primary" 
              @click="showModal = false"
            >
              J'ai compris !
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

<style scoped>
.card-order-modal {
  padding: 24px;
  max-width: 700px;
}

.modal-header {
  text-align: center;
  margin-bottom: 24px;
}

.modal-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.modal-subtitle {
  color: #6b7280;
  font-size: 0.95rem;
}

.cards-section {
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #e5e7eb;
}

.cards-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 12px;
}

.card-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.card-rank-number {
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: white;
  font-size: 12px;
  font-weight: bold;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-preview {
  width: 70px;
  height: 90px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #e5e7eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.card-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.card-label {
  font-size: 11px;
  font-weight: 600;
  text-align: center;
  color: #374151;
}

.joker-section {
  background: rgba(245, 158, 11, 0.1);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 20px;
}

.joker-container {
  display: flex;
  gap: 20px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.joker-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.joker-preview {
  width: 90px;
  height: 115px;
  border-radius: 8px;
  overflow: hidden;
  border: 3px solid #f59e0b;
  box-shadow: 0 0 12px rgba(245, 158, 11, 0.4);
}

.joker-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.joker-label {
  font-size: 14px;
  font-weight: 700;
  color: #d97706;
}

.joker-rules {
  flex: 1;
  min-width: 250px;
}

.joker-rules-list {
  list-style: none;
  padding: 0;
  margin: 8px 0 0 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
}

.modal-footer {
  display: flex;
  justify-content: center;
  margin-top: 16px;
}

/* Dark mode */
:root.dark .modal-subtitle {
  color: #9ca3af;
}

:root.dark .section-title {
  border-color: #374151;
}

:root.dark .card-preview {
  border-color: #374151;
}

:root.dark .card-label {
  color: #d1d5db;
}

:root.dark .joker-section {
  background: rgba(245, 158, 11, 0.15);
}
</style>
