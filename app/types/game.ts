// Types pour le jeu Bullshit/Menteur avec cartes personnalisées

// Les 7 cartes principales (dans l'ordre croissant) + le Joker (Peto)
export type CardType = 'gabriel' | 'jules' | 'nolan' | 'pontus' | 'sofiane' | 'thomasf' | 'thomask' | 'peto'

// Ordre des cartes (du plus faible au plus fort)
export const CARD_ORDER: CardType[] = ['gabriel', 'jules', 'nolan', 'pontus', 'sofiane', 'thomasf', 'thomask']

// Le Joker (doit toujours mentir pour le jouer)
export const JOKER_CARD: CardType = 'peto'

// Toutes les cartes disponibles
export const ALL_CARDS: CardType[] = [...CARD_ORDER, JOKER_CARD]

// Informations sur les cartes
export const CARD_INFO: Record<CardType, { name: string; image: string; order: number; isJoker: boolean }> = {
  gabriel: { name: 'Gabriel', image: '/images/gabriel.jpeg', order: 1, isJoker: false },
  jules: { name: 'Jules', image: '/images/jules.jpeg', order: 2, isJoker: false },
  nolan: { name: 'Nolan', image: '/images/nolan.png', order: 3, isJoker: false },
  pontus: { name: 'Pontus', image: '/images/pontus.jpeg', order: 4, isJoker: false },
  sofiane: { name: 'Sofiane', image: '/images/sofiane.jpeg', order: 5, isJoker: false },
  thomasf: { name: 'Thomas F', image: '/images/thomasf.jpeg', order: 6, isJoker: false },
  thomask: { name: 'Thomas K', image: '/images/thomask.png', order: 7, isJoker: false },
  peto: { name: 'Peto (Joker)', image: '/images/peto.png', order: 0, isJoker: true }
}

export interface Card {
  id: string
  type: CardType
  faceUp: boolean
}

export interface Player {
  id: string
  name: string
  cards: Card[]
  isAI: boolean
  isCurrentTurn: boolean
}

export interface PlayedCards {
  cards: Card[]
  claimedType: CardType
  playerId: string
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  pile: Card[]
  currentCardType: CardType | null
  lastPlay: PlayedCards | null
  gamePhase: 'setup' | 'playing' | 'challenge' | 'gameOver'
  winner: Player | null
  message: string
  canChallenge: boolean
}

// Helpers pour obtenir le type suivant
export function getNextCardType(currentType: CardType | null): CardType {
  if (!currentType) return CARD_ORDER[0]!
  const index = CARD_ORDER.indexOf(currentType)
  if (index === -1) return CARD_ORDER[0]!
  return CARD_ORDER[(index + 1) % CARD_ORDER.length]!
}

// Vérifier si une carte est un joker
export function isJoker(cardType: CardType): boolean {
  return cardType === JOKER_CARD
}
