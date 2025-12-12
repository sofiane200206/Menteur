import { Server } from 'socket.io'
import type { Card, CardType } from '../../app/types/game'
import { CARD_ORDER, JOKER_CARD, getNextCardType, isJoker, CARD_INFO } from '../../app/types/game'

interface Room {
  id: string
  name: string
  hostId: string
  players: OnlinePlayer[]
  maxPlayers: number
  status: 'waiting' | 'playing' | 'finished'
  gameState: GameState | null
}

interface OnlinePlayer {
  id: string
  socketId: string
  name: string
  isHost: boolean
  isReady: boolean
  isConnected: boolean
  cards: Card[]
  isCurrentTurn: boolean
}

interface GameState {
  currentPlayerIndex: number
  pile: Card[]
  currentCardType: CardType | null
  lastPlay: {
    cards: Card[]
    claimedType: CardType
    playerId: string
  } | null
  gamePhase: 'waiting' | 'playing' | 'challenge' | 'gameOver'
  winnerId: string | null
  message: string
  canChallenge: boolean
}

// Stockage en mémoire (en production, utiliser Redis)
const rooms = new Map<string, Room>()
const playerRooms = new Map<string, string>() // socketId -> roomId

function generateRoomId(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function createDeck(): Card[] {
  const deck: Card[] = []
  let id = 0
  
  // 4 copies de chaque carte principale
  for (const cardType of CARD_ORDER) {
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `card-${id++}`,
        type: cardType,
        faceUp: false
      })
    }
  }
  
  // 2 copies du Joker (Peto)
  for (let i = 0; i < 2; i++) {
    deck.push({
      id: `card-${id++}`,
      type: JOKER_CARD,
      faceUp: false
    })
  }
  
  return deck
}

function shuffleDeck(deck: Card[]): Card[] {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const temp = shuffled[i]!
    shuffled[i] = shuffled[j]!
    shuffled[j] = temp
  }
  return shuffled
}

function dealCards(players: OnlinePlayer[], deck: Card[]): void {
  const cardsPerPlayer = Math.floor(deck.length / players.length)
  let cardIndex = 0

  for (const player of players) {
    player.cards = deck.slice(cardIndex, cardIndex + cardsPerPlayer)
    cardIndex += cardsPerPlayer
  }
}

function getPublicGameState(room: Room): any {
  if (!room.gameState) return null
  
  return {
    players: room.players.map(p => ({
      id: p.id,
      name: p.name,
      cardCount: p.cards.length,
      isCurrentTurn: p.isCurrentTurn,
      isConnected: p.isConnected
    })),
    currentPlayerIndex: room.gameState.currentPlayerIndex,
    pileCount: room.gameState.pile.length,
    currentCardType: room.gameState.currentCardType,
    lastPlay: room.gameState.lastPlay ? {
      cardCount: room.gameState.lastPlay.cards.length,
      claimedType: room.gameState.lastPlay.claimedType,
      playerId: room.gameState.lastPlay.playerId,
      cards: room.gameState.lastPlay.cards // Montrer les cartes si révélées
    } : null,
    gamePhase: room.gameState.gamePhase,
    winnerId: room.gameState.winnerId,
    message: room.gameState.message,
    canChallenge: room.gameState.canChallenge
  }
}

export default defineNitroPlugin((nitroApp) => {
  const io = new Server({
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true
  })

  // Attacher Socket.IO au serveur HTTP de Nitro
  nitroApp.hooks.hook('request', (event) => {
    // @ts-expect-error - accès au serveur node
    if (!event.node.res.socket?.server._socketIoAttached) {
      // @ts-expect-error - accès au serveur node
      io.attach(event.node.res.socket?.server)
      // @ts-expect-error - marquer comme attaché
      event.node.res.socket.server._socketIoAttached = true
      console.log('🎮 Socket.IO attached to Nitro server')
    }
  })

  console.log('🎮 Socket.IO plugin initialized')

  io.on('connection', (socket) => {
    console.log(`✅ Player connected: ${socket.id}`)

    // Créer une room
    socket.on('room:create', ({ playerName, roomName, maxPlayers }) => {
      const roomId = generateRoomId()
      const playerId = socket.id

      const player: OnlinePlayer = {
        id: playerId,
        socketId: socket.id,
        name: playerName,
        isHost: true,
        isReady: true,
        isConnected: true,
        cards: [],
        isCurrentTurn: false
      }

      const room: Room = {
        id: roomId,
        name: roomName || `Partie de ${playerName}`,
        hostId: playerId,
        players: [player],
        maxPlayers: Math.min(Math.max(maxPlayers || 4, 2), 6),
        status: 'waiting',
        gameState: null
      }

      rooms.set(roomId, room)
      playerRooms.set(socket.id, roomId)
      socket.join(roomId)

      socket.emit('room:created', room)
      console.log(`🏠 Room created: ${roomId} by ${playerName}`)
    })

    // Rejoindre une room
    socket.on('room:join', ({ playerName, roomId }) => {
      const room = rooms.get(roomId)

      if (!room) {
        socket.emit('room:error', 'Cette partie n\'existe pas')
        return
      }

      if (room.status !== 'waiting') {
        socket.emit('room:error', 'Cette partie a déjà commencé')
        return
      }

      if (room.players.length >= room.maxPlayers) {
        socket.emit('room:error', 'Cette partie est complète')
        return
      }

      const player: OnlinePlayer = {
        id: socket.id,
        socketId: socket.id,
        name: playerName,
        isHost: false,
        isReady: false,
        isConnected: true,
        cards: [],
        isCurrentTurn: false
      }

      room.players.push(player)
      playerRooms.set(socket.id, roomId)
      socket.join(roomId)

      socket.emit('room:joined', room)
      socket.to(roomId).emit('room:playerJoined', player)
      io.to(roomId).emit('room:updated', room)

      console.log(`👤 ${playerName} joined room ${roomId}`)
    })

    // Marquer prêt
    socket.on('room:ready', () => {
      const roomId = playerRooms.get(socket.id)
      if (!roomId) return

      const room = rooms.get(roomId)
      if (!room) return

      const player = room.players.find(p => p.socketId === socket.id)
      if (player) {
        player.isReady = !player.isReady
        io.to(roomId).emit('room:updated', room)
      }
    })

    // Démarrer la partie
    socket.on('room:start', () => {
      const roomId = playerRooms.get(socket.id)
      if (!roomId) return

      const room = rooms.get(roomId)
      if (!room) return

      // Vérifier que c'est l'hôte
      if (room.hostId !== socket.id) {
        socket.emit('room:error', 'Seul l\'hôte peut démarrer la partie')
        return
      }

      // Vérifier que tout le monde est prêt
      if (room.players.length < 2) {
        socket.emit('room:error', 'Il faut au moins 2 joueurs')
        return
      }

      const allReady = room.players.every(p => p.isReady || p.isHost)
      if (!allReady) {
        socket.emit('room:error', 'Tous les joueurs doivent être prêts')
        return
      }

      // Démarrer le jeu
      const deck = shuffleDeck(createDeck())
      dealCards(room.players, deck)

      room.players[0]!.isCurrentTurn = true
      room.status = 'playing'
      const firstCardType = CARD_ORDER[0]!
      room.gameState = {
        currentPlayerIndex: 0,
        pile: [],
        currentCardType: null,
        lastPlay: null,
        gamePhase: 'playing',
        winnerId: null,
        message: `C'est à ${room.players[0]!.name} de jouer ! Posez des cartes comme "${CARD_INFO[firstCardType].name}".`,
        canChallenge: false
      }

      // Envoyer les cartes à chaque joueur
      for (const player of room.players) {
        io.to(player.socketId).emit('player:cards', player.cards.map(c => ({ ...c, faceUp: true })))
      }

      io.to(roomId).emit('game:started', getPublicGameState(room))
      console.log(`🎮 Game started in room ${roomId}`)
    })

    // Jouer des cartes
    socket.on('game:playCards', ({ cardIds, claimedType }) => {
      const roomId = playerRooms.get(socket.id)
      if (!roomId) return

      const room = rooms.get(roomId)
      if (!room || !room.gameState) return

      const currentPlayer = room.players[room.gameState.currentPlayerIndex]
      if (!currentPlayer || currentPlayer.socketId !== socket.id) {
        socket.emit('room:error', 'Ce n\'est pas votre tour')
        return
      }

      if (cardIds.length === 0) {
        socket.emit('room:error', 'Vous devez jouer au moins une carte')
        return
      }

      // Vérifier si le joueur essaie de jouer légalement un Joker (interdit!)
      const cardsToPlay = currentPlayer.cards.filter(c => cardIds.includes(c.id))
      const hasJoker = cardsToPlay.some(c => isJoker(c.type))
      
      if (hasJoker && claimedType === JOKER_CARD) {
        socket.emit('room:error', '🃏 Le Joker (Peto) ne peut JAMAIS être joué légalement ! Tu dois mentir pour le poser !')
        return
      }

      // Retirer les cartes de la main du joueur
      const playedCards: Card[] = []
      for (const cardId of cardIds) {
        const cardIndex = currentPlayer.cards.findIndex(c => c.id === cardId)
        if (cardIndex !== -1) {
          const card = currentPlayer.cards.splice(cardIndex, 1)[0]
          if (card) {
            card.faceUp = false
            playedCards.push(card)
          }
        }
      }

      // Ajouter à la pile
      room.gameState.pile.push(...playedCards)
      room.gameState.lastPlay = {
        cards: playedCards,
        claimedType,
        playerId: currentPlayer.id
      }
      room.gameState.currentCardType = claimedType
      room.gameState.canChallenge = true

      // Vérifier victoire
      if (currentPlayer.cards.length === 0) {
        room.gameState.gamePhase = 'gameOver'
        room.gameState.winnerId = currentPlayer.id
        room.gameState.message = `🎉 ${currentPlayer.name} a gagné !`
        room.status = 'finished'
        io.to(roomId).emit('game:updated', getPublicGameState(room))
        io.to(roomId).emit('game:ended', currentPlayer.id)
        return
      }

      const cardName = CARD_INFO[claimedType].name
      room.gameState.message = `${currentPlayer.name} a joué ${playedCards.length} carte(s) comme "${cardName}".`

      // Passer au joueur suivant
      currentPlayer.isCurrentTurn = false
      room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.length
      const nextPlayer = room.players[room.gameState.currentPlayerIndex]
      if (nextPlayer) {
        nextPlayer.isCurrentTurn = true
        const nextType = getNextCardType(room.gameState.currentCardType)
        const nextTypeName = CARD_INFO[nextType].name
        room.gameState.message += ` C'est à ${nextPlayer.name} de jouer (${nextTypeName}).`
      }

      // Envoyer la mise à jour des cartes au joueur qui a joué
      io.to(currentPlayer.socketId).emit('player:cards', currentPlayer.cards.map(c => ({ ...c, faceUp: true })))
      io.to(roomId).emit('game:updated', getPublicGameState(room))
    })

    // Challenge
    socket.on('game:challenge', () => {
      const roomId = playerRooms.get(socket.id)
      if (!roomId) return

      const room = rooms.get(roomId)
      if (!room || !room.gameState || !room.gameState.lastPlay) return

      if (!room.gameState.canChallenge) {
        socket.emit('room:error', 'Vous ne pouvez pas contester maintenant')
        return
      }

      const challenger = room.players.find(p => p.socketId === socket.id)
      const accused = room.players.find(p => p.id === room.gameState!.lastPlay!.playerId)

      if (!challenger || !accused) return

      room.gameState.gamePhase = 'challenge'
      room.gameState.canChallenge = false

      const claimedType = room.gameState.lastPlay.claimedType
      const actualCards = room.gameState.lastPlay.cards
      const wasLying = actualCards.some(card => card.type !== claimedType)

      // Révéler les cartes
      actualCards.forEach(card => card.faceUp = true)

      room.gameState.message = wasLying
        ? `🔍 ${challenger.name} crie MENTEUR ! ${accused.name} a MENTI !`
        : `🔍 ${challenger.name} crie MENTEUR ! Mais ${accused.name} disait la VÉRITÉ !`

      io.to(roomId).emit('game:updated', getPublicGameState(room))

      // Après un délai, donner les cartes au perdant
      setTimeout(() => {
        if (!room.gameState) return

        const loser = wasLying ? accused : challenger

        if (wasLying) {
          room.gameState.message = `🎯 ${accused.name} récupère la pile (${room.gameState.pile.length} cartes).`
          accused.cards.push(...room.gameState.pile)
        } else {
          room.gameState.message = `❌ ${challenger.name} récupère la pile (${room.gameState.pile.length} cartes).`
          challenger.cards.push(...room.gameState.pile)
        }

        room.gameState.pile = []
        room.gameState.lastPlay = null
        room.gameState.gamePhase = 'playing'

        // Le perdant joue
        room.players.forEach(p => p.isCurrentTurn = false)
        const loserIndex = room.players.findIndex(p => p.id === loser.id)
        room.gameState.currentPlayerIndex = loserIndex
        const loserPlayer = room.players[loserIndex]
        if (loserPlayer) {
          loserPlayer.isCurrentTurn = true
          const nextType = getNextCardType(room.gameState.currentCardType)
          const nextTypeName = CARD_INFO[nextType].name
          room.gameState.message += ` C'est à ${loserPlayer.name} de jouer (${nextTypeName}).`
        }

        // Envoyer les cartes mises à jour
        io.to(loser.socketId).emit('player:cards', loser.cards.map(c => ({ ...c, faceUp: true })))
        io.to(roomId).emit('game:updated', getPublicGameState(room))
      }, 3000)
    })

    // Quitter la room
    socket.on('room:leave', () => {
      handleDisconnect(socket.id)
    })

    // Déconnexion
    socket.on('disconnect', () => {
      console.log(`❌ Player disconnected: ${socket.id}`)
      handleDisconnect(socket.id)
    })

    function handleDisconnect(socketId: string) {
      const roomId = playerRooms.get(socketId)
      if (!roomId) return

      const room = rooms.get(roomId)
      if (!room) return

      const playerIndex = room.players.findIndex(p => p.socketId === socketId)
      if (playerIndex === -1) return

      const player = room.players[playerIndex]!
      
      if (room.status === 'waiting') {
        // Retirer le joueur
        room.players.splice(playerIndex, 1)
        
        if (room.players.length === 0) {
          // Supprimer la room vide
          rooms.delete(roomId)
        } else if (player.isHost && room.players.length > 0) {
          // Transférer l'hôte
          room.players[0]!.isHost = true
          room.hostId = room.players[0]!.id
        }
      } else {
        // Marquer comme déconnecté mais garder dans le jeu
        player.isConnected = false
      }

      playerRooms.delete(socketId)
      io.to(roomId).emit('room:playerLeft', socketId)
      io.to(roomId).emit('room:updated', room)
    }
  })
})
