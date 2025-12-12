// server.mjs - Serveur de production avec Nitro + Socket.IO sur le même port
import { createServer } from 'http'
import { Server } from 'socket.io'

// Variables
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

// Stockage en mémoire
const rooms = new Map()
const playerRooms = new Map()

function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

function createDeck() {
  const deck = []
  let id = 0
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ id: `card-${id++}`, suit, rank, faceUp: false })
    }
  }
  return deck
}

function shuffleDeck(deck) {
  const shuffled = [...deck]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function getNextRank(currentRank) {
  if (!currentRank) return 'A'
  const index = RANKS.indexOf(currentRank)
  return RANKS[(index + 1) % RANKS.length]
}

function dealCards(players, deck) {
  const cardsPerPlayer = Math.floor(deck.length / players.length)
  let cardIndex = 0
  for (const player of players) {
    player.cards = deck.slice(cardIndex, cardIndex + cardsPerPlayer)
    cardIndex += cardsPerPlayer
  }
}

function getPublicGameState(room) {
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
    currentRank: room.gameState.currentRank,
    lastPlay: room.gameState.lastPlay ? {
      cardCount: room.gameState.lastPlay.cards.length,
      claimedRank: room.gameState.lastPlay.claimedRank,
      playerId: room.gameState.lastPlay.playerId,
      cards: room.gameState.lastPlay.cards
    } : null,
    gamePhase: room.gameState.gamePhase,
    winnerId: room.gameState.winnerId,
    message: room.gameState.message,
    canChallenge: room.gameState.canChallenge
  }
}

async function start() {
  // Importer l'app Nitro buildée
  const { handler } = await import('./.output/server/index.mjs')
  
  // Créer le serveur HTTP
  const httpServer = createServer(handler)
  
  // Attacher Socket.IO au même serveur
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true
    },
    // Important pour Render et autres proxies
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000
  })

  console.log('🎮 Socket.IO attached to server')

  io.on('connection', (socket) => {
    console.log(`✅ Player connected: ${socket.id}`)

    socket.on('room:create', ({ playerName, roomName, maxPlayers }) => {
      const roomId = generateRoomId()
      const player = {
        id: socket.id,
        socketId: socket.id,
        name: playerName,
        isHost: true,
        isReady: true,
        isConnected: true,
        cards: [],
        isCurrentTurn: false
      }

      const room = {
        id: roomId,
        name: roomName || `Partie de ${playerName}`,
        hostId: socket.id,
        players: [player],
        maxPlayers: Math.min(Math.max(maxPlayers || 4, 2), 6),
        status: 'waiting',
        gameState: null
      }

      rooms.set(roomId, room)
      playerRooms.set(socket.id, roomId)
      socket.join(roomId)
      socket.emit('room:created', room)
      console.log(`🏠 Room created: ${roomId}`)
    })

    socket.on('room:join', ({ playerName, roomId }) => {
      const room = rooms.get(roomId)
      if (!room) return socket.emit('room:error', 'Cette partie n\'existe pas')
      if (room.status !== 'waiting') return socket.emit('room:error', 'Partie déjà commencée')
      if (room.players.length >= room.maxPlayers) return socket.emit('room:error', 'Partie complète')

      const player = {
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
      console.log(`👤 ${playerName} joined ${roomId}`)
    })

    socket.on('room:ready', () => {
      const roomId = playerRooms.get(socket.id)
      const room = rooms.get(roomId)
      if (!room) return

      const player = room.players.find(p => p.socketId === socket.id)
      if (player) {
        player.isReady = !player.isReady
        io.to(roomId).emit('room:updated', room)
      }
    })

    socket.on('room:start', () => {
      const roomId = playerRooms.get(socket.id)
      const room = rooms.get(roomId)
      if (!room || room.hostId !== socket.id) return

      if (room.players.length < 2) return socket.emit('room:error', 'Il faut au moins 2 joueurs')
      if (!room.players.every(p => p.isReady || p.isHost)) return socket.emit('room:error', 'Joueurs pas prêts')

      const deck = shuffleDeck(createDeck())
      dealCards(room.players, deck)
      room.players[0].isCurrentTurn = true
      room.status = 'playing'
      room.gameState = {
        currentPlayerIndex: 0,
        pile: [],
        currentRank: null,
        lastPlay: null,
        gamePhase: 'playing',
        winnerId: null,
        message: `C'est à ${room.players[0].name} de jouer !`,
        canChallenge: false
      }

      for (const player of room.players) {
        io.to(player.socketId).emit('player:cards', player.cards.map(c => ({ ...c, faceUp: true })))
      }
      io.to(roomId).emit('game:started', getPublicGameState(room))
      console.log(`🎮 Game started: ${roomId}`)
    })

    socket.on('game:playCards', ({ cardIds, claimedRank }) => {
      const roomId = playerRooms.get(socket.id)
      const room = rooms.get(roomId)
      if (!room?.gameState) return

      const currentPlayer = room.players[room.gameState.currentPlayerIndex]
      if (!currentPlayer || currentPlayer.socketId !== socket.id) return

      const playedCards = []
      for (const cardId of cardIds) {
        const idx = currentPlayer.cards.findIndex(c => c.id === cardId)
        if (idx !== -1) {
          const card = currentPlayer.cards.splice(idx, 1)[0]
          card.faceUp = false
          playedCards.push(card)
        }
      }

      room.gameState.pile.push(...playedCards)
      room.gameState.lastPlay = { cards: playedCards, claimedRank, playerId: currentPlayer.id }
      room.gameState.currentRank = claimedRank
      room.gameState.canChallenge = true

      if (currentPlayer.cards.length === 0) {
        room.gameState.gamePhase = 'gameOver'
        room.gameState.winnerId = currentPlayer.id
        room.gameState.message = `🎉 ${currentPlayer.name} a gagné !`
        room.status = 'finished'
        io.to(roomId).emit('game:updated', getPublicGameState(room))
        return
      }

      room.gameState.message = `${currentPlayer.name} a joué ${playedCards.length} carte(s) comme "${claimedRank}".`
      currentPlayer.isCurrentTurn = false
      room.gameState.currentPlayerIndex = (room.gameState.currentPlayerIndex + 1) % room.players.length
      const nextPlayer = room.players[room.gameState.currentPlayerIndex]
      if (nextPlayer) {
        nextPlayer.isCurrentTurn = true
        room.gameState.message += ` C'est à ${nextPlayer.name} (${getNextRank(claimedRank)}).`
      }

      io.to(currentPlayer.socketId).emit('player:cards', currentPlayer.cards.map(c => ({ ...c, faceUp: true })))
      io.to(roomId).emit('game:updated', getPublicGameState(room))
    })

    socket.on('game:challenge', () => {
      const roomId = playerRooms.get(socket.id)
      const room = rooms.get(roomId)
      if (!room?.gameState?.lastPlay || !room.gameState.canChallenge) return

      const challenger = room.players.find(p => p.socketId === socket.id)
      const accused = room.players.find(p => p.id === room.gameState.lastPlay.playerId)
      if (!challenger || !accused) return

      room.gameState.gamePhase = 'challenge'
      room.gameState.canChallenge = false

      const claimedRank = room.gameState.lastPlay.claimedRank
      const wasLying = room.gameState.lastPlay.cards.some(c => c.rank !== claimedRank)
      room.gameState.lastPlay.cards.forEach(c => c.faceUp = true)

      room.gameState.message = wasLying
        ? `🔍 ${challenger.name} crie MENTEUR ! ${accused.name} a MENTI !`
        : `🔍 ${challenger.name} crie MENTEUR ! Mais ${accused.name} disait la VÉRITÉ !`

      io.to(roomId).emit('game:updated', getPublicGameState(room))

      setTimeout(() => {
        const loser = wasLying ? accused : challenger
        if (wasLying) {
          accused.cards.push(...room.gameState.pile)
          room.gameState.message = `${accused.name} récupère la pile.`
        } else {
          challenger.cards.push(...room.gameState.pile)
          room.gameState.message = `${challenger.name} récupère la pile.`
        }

        room.gameState.pile = []
        room.gameState.lastPlay = null
        room.gameState.gamePhase = 'playing'
        room.players.forEach(p => p.isCurrentTurn = false)

        const loserIndex = room.players.findIndex(p => p.id === loser.id)
        room.gameState.currentPlayerIndex = loserIndex
        room.players[loserIndex].isCurrentTurn = true
        room.gameState.message += ` C'est à ${loser.name} (${getNextRank(room.gameState.currentRank)}).`

        io.to(loser.socketId).emit('player:cards', loser.cards.map(c => ({ ...c, faceUp: true })))
        io.to(roomId).emit('game:updated', getPublicGameState(room))
      }, 3000)
    })

    socket.on('room:leave', () => handleDisconnect(socket.id))
    socket.on('disconnect', () => {
      console.log(`❌ Disconnected: ${socket.id}`)
      handleDisconnect(socket.id)
    })

    function handleDisconnect(socketId) {
      const roomId = playerRooms.get(socketId)
      const room = rooms.get(roomId)
      if (!room) return

      const playerIndex = room.players.findIndex(p => p.socketId === socketId)
      if (playerIndex === -1) return

      const player = room.players[playerIndex]
      if (room.status === 'waiting') {
        room.players.splice(playerIndex, 1)
        if (room.players.length === 0) {
          rooms.delete(roomId)
        } else if (player.isHost) {
          room.players[0].isHost = true
          room.hostId = room.players[0].id
        }
      } else {
        player.isConnected = false
      }

      playerRooms.delete(socketId)
      io.to(roomId).emit('room:playerLeft', socketId)
      io.to(roomId).emit('room:updated', room)
    }
  })

  const port = process.env.PORT || 8080
  httpServer.listen(port, () => {
    console.log(`🚀 Server running on port ${port}`)
  })
}

start().catch(console.error)
