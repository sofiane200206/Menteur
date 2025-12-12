// Types pour le jeu Bullshit/Menteur

export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades'
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K'

export interface Card {
  id: string
  suit: Suit
  rank: Rank
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
  claimedRank: Rank
  playerId: string
}

export interface GameState {
  players: Player[]
  currentPlayerIndex: number
  pile: Card[]
  currentRank: Rank | null
  lastPlay: PlayedCards | null
  gamePhase: 'setup' | 'playing' | 'challenge' | 'gameOver'
  winner: Player | null
  message: string
  canChallenge: boolean
}

export const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades']
export const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export const SUIT_SYMBOLS: Record<Suit, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠'
}

export const SUIT_COLORS: Record<Suit, string> = {
  hearts: 'text-red-500',
  diamonds: 'text-red-500',
  clubs: 'text-gray-900 dark:text-white',
  spades: 'text-gray-900 dark:text-white'
}
