// Types pour le multijoueur
import type { Card, Rank, Player } from './game'

export interface Room {
  id: string
  name: string
  hostId: string
  players: OnlinePlayer[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  gameState: OnlineGameState | null
}

export interface OnlinePlayer {
  id: string
  socketId: string
  name: string
  isHost: boolean
  isReady: boolean
  isConnected: boolean
  cards: Card[]
  isCurrentTurn: boolean
}

export interface OnlineGameState {
  players: OnlinePlayer[]
  currentPlayerIndex: number
  pile: Card[]
  currentRank: Rank | null
  lastPlay: {
    cards: Card[]
    claimedRank: Rank
    playerId: string
  } | null
  gamePhase: 'waiting' | 'playing' | 'challenge' | 'gameOver'
  winnerId: string | null
  message: string
  canChallenge: boolean
}

// Events du client vers le serveur
export interface ClientToServerEvents {
  'room:create': (data: { playerName: string; roomName: string; maxPlayers: number }) => void
  'room:join': (data: { playerName: string; roomId: string }) => void
  'room:leave': () => void
  'room:ready': () => void
  'room:start': () => void
  'game:playCards': (data: { cardIds: string[]; claimedRank: Rank }) => void
  'game:challenge': () => void
}

// Events du serveur vers le client
export interface ServerToClientEvents {
  'room:created': (room: Room) => void
  'room:joined': (room: Room) => void
  'room:updated': (room: Room) => void
  'room:playerJoined': (player: OnlinePlayer) => void
  'room:playerLeft': (playerId: string) => void
  'room:error': (message: string) => void
  'game:started': (gameState: OnlineGameState) => void
  'game:updated': (gameState: OnlineGameState) => void
  'game:ended': (winnerId: string) => void
  'player:cards': (cards: Card[]) => void
}

export interface SocketData {
  odome: string
  odomeId: string
}
