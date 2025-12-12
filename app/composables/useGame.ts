import type { Card, Player, GameState, CardType, PlayedCards } from '~/types/game'
import { CARD_ORDER, JOKER_CARD, getNextCardType, isJoker, CARD_INFO } from '~/types/game'

export function useGame() {
  const gameState = useState<GameState>('gameState', () => ({
    players: [],
    currentPlayerIndex: 0,
    pile: [],
    currentCardType: null,
    lastPlay: null,
    gamePhase: 'setup',
    winner: null,
    message: 'Bienvenue au jeu du Menteur ! Configurez la partie.',
    canChallenge: false
  }))

  // Créer un deck avec les 8 cartes personnalisées (plusieurs copies de chaque)
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
    const firstCardType = CARD_ORDER[0]!
    gameState.value = {
      players,
      currentPlayerIndex: 0,
      pile: [],
      currentCardType: null,
      lastPlay: null,
      gamePhase: 'playing',
      winner: null,
      message: firstPlayer ? `C'est à ${firstPlayer.name} de jouer ! Posez des cartes comme "${CARD_INFO[firstCardType].name}".` : 'Partie commencée !',
      canChallenge: false
    }
  }

  // Jouer des cartes
  function playCards(cardIds: string[], claimedType: CardType) {
    const state = gameState.value
    const currentPlayer = state.players[state.currentPlayerIndex]
    
    if (!currentPlayer) return false
    
    if (cardIds.length === 0) {
      state.message = 'Vous devez jouer au moins une carte !'
      return false
    }

    // Vérifier si le joueur essaie de jouer légalement un Joker (interdit!)
    const cardsToPlay = currentPlayer.cards.filter(c => cardIds.includes(c.id))
    const hasJoker = cardsToPlay.some(c => isJoker(c.type))
    
    // Si on joue un Joker et qu'on dit la vérité, c'est interdit!
    if (hasJoker && claimedType === JOKER_CARD) {
      state.message = '🃏 Le Joker (Peto) ne peut JAMAIS être joué légalement ! Tu dois mentir pour le poser !'
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
      claimedType,
      playerId: currentPlayer.id
    }
    
    state.currentCardType = claimedType
    state.canChallenge = true

    // Vérifier si le joueur a gagné
    if (currentPlayer.cards.length === 0) {
      state.gamePhase = 'gameOver'
      state.winner = currentPlayer
      state.message = `🎉 ${currentPlayer.name} a gagné !`
      return true
    }

    const cardName = CARD_INFO[claimedType].name
    state.message = `${currentPlayer.name} a joué ${playedCards.length} carte(s) comme "${cardName}".`
    
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
        const nextType = getNextCardType(state.currentCardType)
        const typeName = CARD_INFO[nextType].name
        state.message = `C'est à ${nextPlayer.name} de jouer ! Posez des cartes comme "${typeName}".`
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
    const claimedType = state.lastPlay.claimedType
    const actualCards = state.lastPlay.cards
    // Une carte est un mensonge si elle n'est pas du type annoncé (y compris le Joker)
    const wasLying = actualCards.some(card => card.type !== claimedType)

    // Révéler les cartes
    actualCards.forEach(card => card.faceUp = true)

    const typeName = CARD_INFO[claimedType].name
    state.message = wasLying 
      ? `🔍 Révélation... ${accused.name} a MENTI ! Les cartes ne sont pas des "${typeName}" !`
      : `🔍 Révélation... ${accused.name} disait la VÉRITÉ ! Ce sont bien des "${typeName}" !`

    setTimeout(() => {
      if (wasLying) {
        state.message = `🎯 ${challenger.name} avait raison ! ${accused.name} récupère la pile (${state.pile.length} cartes).`
        accused.cards.push(...state.pile.map(c => ({ ...c, faceUp: !accused.isAI })))
      } else {
        state.message = `❌ ${challenger.name} s'est trompé ! ${challenger.name} récupère la pile (${state.pile.length} cartes).`
        challenger.cards.push(...state.pile.map(c => ({ ...c, faceUp: !challenger.isAI })))
      }

      // Vider la pile mais GARDER le type actuel pour continuer la progression
      state.pile = []
      state.lastPlay = null
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
        const nextType = getNextCardType(state.currentCardType)
        const typeName = CARD_INFO[nextType].name
        if (loser.isAI) {
          setTimeout(() => aiTurn(), 1500)
        } else {
          state.message = `C'est à ${loser.name} de jouer ! Posez des cartes comme "${typeName}".`
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
    const expectedType = getNextCardType(state.currentCardType)
    
    // Chercher des cartes du bon type (pas de Joker!)
    const matchingCards = aiPlayer.cards.filter(c => c.type === expectedType)
    const otherCards = aiPlayer.cards.filter(c => c.type !== expectedType && !isJoker(c.type))
    const jokerCards = aiPlayer.cards.filter(c => isJoker(c.type))

    let cardsToPlay: Card[]

    if (matchingCards.length > 0) {
      // Jouer les vraies cartes
      const numToPlay = Math.min(matchingCards.length, Math.floor(Math.random() * 2) + 1)
      cardsToPlay = matchingCards.slice(0, numToPlay)
    } else if (otherCards.length > 0) {
      // Doit mentir - jouer des cartes aléatoires (pas de Joker si possible)
      const numToPlay = Math.floor(Math.random() * 2) + 1
      cardsToPlay = otherCards.slice(0, Math.min(numToPlay, otherCards.length))
    } else if (jokerCards.length > 0) {
      // Ne reste que des Jokers - doit les jouer en mentant
      cardsToPlay = [jokerCards[0]!]
    } else {
      // Pas de cartes
      return
    }

    if (cardsToPlay.length === 0) return

    const cardIds = cardsToPlay.map(c => c.id)
    
    state.message = `${aiPlayer.name} réfléchit... 🤔`
    
    setTimeout(() => {
      playCards(cardIds, expectedType)
    }, 1000)
  }

  // Réinitialiser le jeu
  function resetGame() {
    gameState.value = {
      players: [],
      currentPlayerIndex: 0,
      pile: [],
      currentCardType: null,
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
    getNextCardType,
    currentPlayer,
    humanPlayer,
    isHumanTurn
  }
}
