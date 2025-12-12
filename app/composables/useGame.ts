import type { Card, Player, GameState, Rank, PlayedCards } from '~/types/game'
import { SUITS, RANKS } from '~/types/game'

export function useGame() {
  const gameState = useState<GameState>('gameState', () => ({
    players: [],
    currentPlayerIndex: 0,
    pile: [],
    currentRank: null,
    lastPlay: null,
    gamePhase: 'setup',
    winner: null,
    message: 'Bienvenue au jeu du Menteur ! Configurez la partie.',
    canChallenge: false
  }))

  // Créer un deck de 52 cartes
  function createDeck(): Card[] {
    const deck: Card[] = []
    let id = 0
    for (const suit of SUITS) {
      for (const rank of RANKS) {
        deck.push({
          id: `card-${id++}`,
          suit,
          rank,
          faceUp: false
        })
      }
    }
    return deck
  }

  // Mélanger le deck (Fisher-Yates)
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

  // Distribuer les cartes aux joueurs
  function dealCards(players: Player[], deck: Card[]): void {
    const cardsPerPlayer = Math.floor(deck.length / players.length)
    let cardIndex = 0

    for (const player of players) {
      player.cards = deck.slice(cardIndex, cardIndex + cardsPerPlayer).map(card => ({
        ...card,
        faceUp: !player.isAI
      }))
      cardIndex += cardsPerPlayer
    }
  }

  // Démarrer une nouvelle partie
  function startGame(playerName: string, numAIPlayers: number = 3) {
    const deck = shuffleDeck(createDeck())
    
    const players: Player[] = [
      {
        id: 'player-0',
        name: playerName || 'Joueur',
        cards: [],
        isAI: false,
        isCurrentTurn: true
      }
    ]

    const aiNames = ['Alice 🤖', 'Bob 🤖', 'Charlie 🤖', 'Diana 🤖', 'Eve 🤖']
    for (let i = 0; i < numAIPlayers && i < 5; i++) {
      players.push({
        id: `player-${i + 1}`,
        name: aiNames[i] ?? `IA ${i + 1}`,
        cards: [],
        isAI: true,
        isCurrentTurn: false
      })
    }

    dealCards(players, deck)

    const firstPlayer = players[0]
    gameState.value = {
      players,
      currentPlayerIndex: 0,
      pile: [],
      currentRank: null,
      lastPlay: null,
      gamePhase: 'playing',
      winner: null,
      message: firstPlayer ? `C'est à ${firstPlayer.name} de jouer ! Posez des cartes comme "A".` : 'Partie commencée !',
      canChallenge: false
    }
  }

  // Obtenir le rang suivant dans l'ordre
  function getNextRank(currentRank: Rank | null): Rank {
    if (!currentRank) return 'A'
    const index = RANKS.indexOf(currentRank)
    return RANKS[(index + 1) % RANKS.length] ?? 'A'
  }

  // Jouer des cartes
  function playCards(cardIds: string[], claimedRank: Rank) {
    const state = gameState.value
    const currentPlayer = state.players[state.currentPlayerIndex]
    
    if (!currentPlayer) return false
    
    if (cardIds.length === 0) {
      state.message = 'Vous devez jouer au moins une carte !'
      return false
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
    state.pile.push(...playedCards)
    
    // Enregistrer le dernier coup
    state.lastPlay = {
      cards: playedCards,
      claimedRank,
      playerId: currentPlayer.id
    }
    
    state.currentRank = claimedRank
    state.canChallenge = true

    // Vérifier si le joueur a gagné
    if (currentPlayer.cards.length === 0) {
      state.gamePhase = 'gameOver'
      state.winner = currentPlayer
      state.message = `🎉 ${currentPlayer.name} a gagné !`
      return true
    }

    state.message = `${currentPlayer.name} a joué ${playedCards.length} carte(s) comme "${claimedRank}".`
    
    // Passer au joueur suivant
    nextTurn()
    
    return true
  }

  // Passer au tour suivant
  function nextTurn() {
    const state = gameState.value
    const currentPlayer = state.players[state.currentPlayerIndex]
    if (currentPlayer) {
      currentPlayer.isCurrentTurn = false
    }
    
    state.currentPlayerIndex = (state.currentPlayerIndex + 1) % state.players.length
    
    const nextPlayer = state.players[state.currentPlayerIndex]
    if (nextPlayer) {
      nextPlayer.isCurrentTurn = true
      
      if (nextPlayer.isAI) {
        setTimeout(() => {
          aiTurn()
        }, 1500)
      } else {
        const nextRank = getNextRank(state.currentRank)
        state.message = `C'est à ${nextPlayer.name} de jouer ! Posez des cartes comme "${nextRank}".`
      }
    }
  }

  // Challenge (accuser de mentir)
  function challenge(challengerId: string) {
    const state = gameState.value
    
    if (!state.lastPlay || !state.canChallenge) {
      return false
    }

    const challenger = state.players.find(p => p.id === challengerId)
    const accused = state.players.find(p => p.id === state.lastPlay!.playerId)
    
    if (!challenger || !accused) return false

    state.gamePhase = 'challenge'
    state.canChallenge = false

    // Vérifier si le joueur accusé a menti
    const claimedRank = state.lastPlay.claimedRank
    const actualCards = state.lastPlay.cards
    const wasLying = actualCards.some(card => card.rank !== claimedRank)

    // Révéler les cartes
    actualCards.forEach(card => card.faceUp = true)

    state.message = wasLying 
      ? `🔍 Révélation... ${accused.name} a MENTI ! Les cartes ne sont pas des "${claimedRank}" !`
      : `🔍 Révélation... ${accused.name} disait la VÉRITÉ ! Ce sont bien des "${claimedRank}" !`

    setTimeout(() => {
      if (wasLying) {
        state.message = `🎯 ${challenger.name} avait raison ! ${accused.name} récupère la pile (${state.pile.length} cartes).`
        accused.cards.push(...state.pile.map(c => ({ ...c, faceUp: !accused.isAI })))
      } else {
        state.message = `❌ ${challenger.name} s'est trompé ! ${challenger.name} récupère la pile (${state.pile.length} cartes).`
        challenger.cards.push(...state.pile.map(c => ({ ...c, faceUp: !challenger.isAI })))
      }

      // Vider la pile mais GARDER le rang actuel pour continuer la progression
      state.pile = []
      state.lastPlay = null
      // Ne pas remettre currentRank à null - on continue la progression !
      state.gamePhase = 'playing'

      // Le perdant du challenge commence le prochain tour
      const loserIndex = wasLying 
        ? state.players.findIndex(p => p.id === accused.id)
        : state.players.findIndex(p => p.id === challenger.id)
      
      state.players.forEach(p => p.isCurrentTurn = false)
      state.currentPlayerIndex = loserIndex
      
      const loser = state.players[loserIndex]
      if (loser) {
        loser.isCurrentTurn = true
        const nextRank = getNextRank(state.currentRank)
        if (loser.isAI) {
          setTimeout(() => aiTurn(), 1500)
        } else {
          state.message = `C'est à ${loser.name} de jouer ! Posez des cartes comme "${nextRank}".`
        }
      }
    }, 2500)

    return true
  }

  // Tour de l'IA
  function aiTurn() {
    const state = gameState.value
    const aiPlayer = state.players[state.currentPlayerIndex]
    
    if (!aiPlayer || !aiPlayer.isAI || state.gamePhase !== 'playing') return

    // Décider si l'IA challenge le dernier coup
    if (state.canChallenge && state.lastPlay && Math.random() < 0.3) {
      state.message = `${aiPlayer.name} crie "MENTEUR !" 🔍`
      setTimeout(() => {
        challenge(aiPlayer.id)
      }, 1000)
      return
    }

    // L'IA joue des cartes
    const expectedRank = getNextRank(state.currentRank)
    
    // Chercher des cartes du bon rang
    const matchingCards = aiPlayer.cards.filter(c => c.rank === expectedRank)
    const otherCards = aiPlayer.cards.filter(c => c.rank !== expectedRank)

    let cardsToPlay: Card[]

    if (matchingCards.length > 0) {
      // Jouer les vraies cartes
      const numToPlay = Math.min(matchingCards.length, Math.floor(Math.random() * 2) + 1)
      cardsToPlay = matchingCards.slice(0, numToPlay)
    } else {
      // Doit mentir - jouer des cartes aléatoires
      const numToPlay = Math.floor(Math.random() * 2) + 1
      cardsToPlay = otherCards.slice(0, Math.min(numToPlay, otherCards.length))
    }

    // S'assurer qu'on a au moins une carte
    if (cardsToPlay.length === 0 && aiPlayer.cards.length > 0) {
      const firstCard = aiPlayer.cards[0]
      if (firstCard) {
        cardsToPlay = [firstCard]
      }
    }

    if (cardsToPlay.length === 0) return

    const cardIds = cardsToPlay.map(c => c.id)
    
    state.message = `${aiPlayer.name} réfléchit... 🤔`
    
    setTimeout(() => {
      playCards(cardIds, expectedRank)
    }, 1000)
  }

  // Réinitialiser le jeu
  function resetGame() {
    gameState.value = {
      players: [],
      currentPlayerIndex: 0,
      pile: [],
      currentRank: null,
      lastPlay: null,
      gamePhase: 'setup',
      winner: null,
      message: 'Bienvenue au jeu du Menteur ! Configurez la partie.',
      canChallenge: false
    }
  }

  // Obtenir le joueur courant
  const currentPlayer = computed(() => {
    return gameState.value.players[gameState.value.currentPlayerIndex]
  })

  // Obtenir le joueur humain
  const humanPlayer = computed(() => {
    return gameState.value.players.find(p => !p.isAI)
  })

  // Vérifier si c'est le tour du joueur humain
  const isHumanTurn = computed(() => {
    const current = currentPlayer.value
    return current ? !current.isAI : false
  })

  return {
    gameState,
    startGame,
    playCards,
    challenge,
    resetGame,
    getNextRank,
    currentPlayer,
    humanPlayer,
    isHumanTurn
  }
}
