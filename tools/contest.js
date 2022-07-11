import { rating, rate, ordinal } from '/static/lib/openskill.js/index.js'

export class Match {
  winner
  loser

  constructor(winner, loser) {
    this.winner = winner
    this.loser = loser
  }
}

export class Contest {
  id
  title
  cardRanks
  cardMatches

  constructor(id, title, cardRanks, cardMatches) {
    this.id = id
    this.title = title
    // this.cardRanks = cardRanks.map(rank => (
    //     {
    //       id: rank.id,
    //       rating: rank.rating
    //     }))
    this.cardRanks = []
    if (!cardMatches) return;
    this.cardMatches = cardMatches.map(m => new Match(m.winner, m.loser))

    this.runAllMatches()
  }

  async getNextMatch(allCards) {
    const m = this

    // weird function that picks the 2 best cards
    let existingPicked = 0
    let chosenCards = []
    const unseenCards = allCards
      .filter(c => m.cardRanks.find(r => r.id == c.id) == null)

    function GetBestCard(except = []) {
      // debugger
      let id = -1
      const filteredUnseen = unseenCards
          .filter(c => except.find(e => e.id === c.id) == null) // don't repeat them
      if (filteredUnseen.length > 0) {
        id = filteredUnseen[0].id
      } else {
        const filteredRanks = m.cardRanks
          .filter(c => except.find(e => e.id === c.id) == null) // don't repeat them

        // if its not the first card, pick a random one
        if(except.length > 0) {
          id = filteredRanks[Math.floor(Math.random() * filteredRanks.length)].id
        } else {
          // sort by sigma
          filteredRanks.sort((a, b) => b.rating.sigma - a.rating.sigma)
          // // find the highest sigma (unkown info)
          // const highestSigma = updatedRanks[0].rating.sigma
          // const highestSigmaCards = updatedRanks
          //   .filter(s => s.rating.sigma == highestSigma) // get highestSigma cards only

          // // randomize them
          // highestSigmaCards.sort((_, __) => Math.random() * 0.5)
          // const highestS

          id = filteredRanks[0].id;
        }
      }

      return allCards.find(c => c.id === id)
    }

    const card1 = GetBestCard()
    const card2 = GetBestCard([card1])

   // console.log("picked new cards!", card1, card2)
    return [card1, card2]
  }

  runAllMatches(match) {
    for(let m of this.cardMatches) {
      this.runMatch(m)
    }
  }

  addMatch(match) {
    const m = { winner: match.winner, loser: match.loser }
    if (this.cardMatches == null){
      this.cardMatches = [m];
    } else {
      this.cardMatches.push(m);
    }
  }

  runMatch(match) {
    const winnerRating = this.getCardRating(match.winner)
    const loserRating = this.getCardRating(match.loser)
    const [[newWinnerRating], [newLoserRating]] = rate([[winnerRating], [loserRating]])

    this.updateOrCreateCard(match.winner, newWinnerRating)
    this.updateOrCreateCard(match.loser, newLoserRating)
  }

  getCardRating(id) {
    // try getting existing card rating
    const rankedCard = this.cardRanks.find(c => c.id === id)
    if (rankedCard != null) return rankedCard.rating

    // return an new rating
    return rating()
  }

  updateOrCreateCard(id, rating) {
    const rankedCard = this.cardRanks.find(c => c.id === id);
    if (rankedCard != null) {
      rankedCard.rating = rating
    } else {
      const newCard = {
        id, rating
      }
      this.cardRanks.push(newCard)
    }
  }
}