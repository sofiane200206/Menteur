import { io, Socket } from 'socket.io-client'
import type { Card, CardType } from '~/types/game'
import { CARD_ORDER, getNextCardType } from '~/types/game'

interface Room {
  id: string
  name: string
  hostId: string
  players: OnlinePlayer[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
}

interface OnlinePlayer {
  id: string
  socketId: string
  name: string
  isHost: boolean
  isReady: boolean
  isConnected: boolean
  cardCount?: number
  isCurrentTurn: boolean
}

interface PublicGameState {
  players: { id: string; name: string; cardCount: number; isCurrentTurn: boolean; isConnected: boolean }[]
  currentPlayerIndex: number
  pileCount: number
  currentCardType: CardType | null
  lastPlay: {
    cardCount: number
    claimedType: CardType
    playerId: string
    cards?: Card[]
  } | null
  gamePhase: 'waiting' | 'playing' | 'challenge' | 'gameOver'
  winnerId: string | null
  message: string
  canChallenge: boolean
}

// État global partagé entre tous les composants
const socket = ref<Socket | null>(null)
const isConnected = ref(false)
const room = ref<Room | null>(null)
const gameState = ref<PublicGameState | null>(null)
const myCards = ref<Card[]>([])
const myId = ref<string>('')
const error = ref<string>('')

export function useMultiplayer() {

  // Connexion au serveur WebSocket
  function connect() {
    if (socket.value?.connected) return

    const config = useRuntimeConfig()
    // Utiliser l'URL du serveur WebSocket depuis la config
    // Si vide, utiliser la même origine (pour Render où tout est sur le même serveur)
    const socketUrl = (config.public.socketUrl as string) || window.location.origin
    
    console.log('🔌 Connecting to Socket.IO:', socketUrl)
    
    socket.value = io(socketUrl, {
      transports: ['polling', 'websocket'], // Polling d'abord, plus fiable
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000
    })

    socket.value.on('connect', () => {
      isConnected.value = true
      myId.value = socket.value!.id ?? ''
      console.log('✅ Connected to server:', myId.value)
    })

    socket.value.on('connect_error', (err) => {
      console.error('❌ Connection error:', err.message)
      error.value = 'Erreur de connexion au serveur'
    })

    socket.value.on('disconnect', (reason) => {
      isConnected.value = false
      console.log('❌ Disconnected from server:', reason)
    })

    // Events de room
    socket.value.on('room:created', (r: Room) => {
      room.value = r
      error.value = ''
    })

    socket.value.on('room:joined', (r: Room) => {
      room.value = r
      error.value = ''
    })

    socket.value.on('room:updated', (r: Room) => {
      room.value = r
    })

    socket.value.on('room:playerJoined', (player: OnlinePlayer) => {
      if (room.value) {
        const exists = room.value.players.find(p => p.id === player.id)
        if (!exists) {
          room.value.players.push(player)
        }
      }
    })

    socket.value.on('room:playerLeft', (playerId: string) => {
      if (room.value) {
        room.value.players = room.value.players.filter(p => p.id !== playerId)
      }
    })

    socket.value.on('room:error', (msg: string) => {
      error.value = msg
      setTimeout(() => error.value = '', 5000)
    })

    // Events de jeu
    socket.value.on('game:started', (state: PublicGameState) => {
      gameState.value = state
    })

    socket.value.on('game:updated', (state: PublicGameState) => {
      gameState.value = state
    })

    socket.value.on('player:cards', (cards: Card[]) => {
      myCards.value = cards
    })

    socket.value.on('game:ended', (winnerId: string) => {
      // Géré via gameState
    })
  }

  // Créer une room
  function createRoom(playerName: string, roomName: string, maxPlayers: number = 4) {
    if (!socket.value) connect()
    socket.value?.emit('room:create', { playerName, roomName, maxPlayers })
  }

  // Rejoindre une room
  function joinRoom(playerName: string, roomId: string) {
    if (!socket.value) connect()
    socket.value?.emit('room:join', { playerName, roomId: roomId.toUpperCase() })
  }

  // Marquer prêt
  function toggleReady() {
    socket.value?.emit('room:ready')
  }

  // Démarrer la partie
  function startGame() {
    socket.value?.emit('room:start')
  }

  // Jouer des cartes
  function playCards(cardIds: string[], claimedType: CardType) {
    socket.value?.emit('game:playCards', { cardIds, claimedType })
  }

  // Challenger
  function challenge() {
    socket.value?.emit('game:challenge')
  }

  // Quitter la room
  function leaveRoom() {
    socket.value?.emit('room:leave')
    room.value = null
    gameState.value = null
    myCards.value = []
  }

  // Déconnexion
  function disconnect() {
    socket.value?.disconnect()
    socket.value = null
    isConnected.value = false
    room.value = null
    gameState.value = null
    myCards.value = []
  }

  // Vérifier si c'est mon tour
  const isMyTurn = computed(() => {
    if (!gameState.value || !myId.value) return false
    const me = gameState.value.players.find(p => p.id === myId.value)
    return me?.isCurrentTurn ?? false
  })

  // Vérifier si je suis l'hôte
  const isHost = computed(() => {
    if (!room.value || !myId.value) return false
    return room.value.hostId === myId.value
  })

  // Type attendu
  const expectedType = computed((): CardType => {
    return getNextCardType(gameState.value?.currentCardType ?? null)
  })

  return {
    socket,
    isConnected,
    room,
    gameState,
    myCards,
    myId,
    error,
    isMyTurn,
    isHost,
    expectedType,
    connect,
    createRoom,
    joinRoom,
    toggleReady,
    startGame,
    playCards,
    challenge,
    leaveRoom,
    disconnect
  }
}
