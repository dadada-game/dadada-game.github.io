import { rating, rate, ordinal } from '/static/lib/openskill.js/index.js'
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js'
import { collection, getFirestore, getDocs, doc, getDoc  } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-firestore.js'



const firebaseConfig = {

  apiKey: "AIzaSyBlTsXWbJlWlyZ9hcfKLSw2WETFjBvnhRo",

  authDomain: "dadada-12228.firebaseapp.com",

  projectId: "dadada-12228",

  storageBucket: "dadada-12228.appspot.com",

  messagingSenderId: "349029071019",

  appId: "1:349029071019:web:e29259ffea1bb733291fee"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

class Card {
  id
  name
  img

  constructor(id, name, img) {
    this.id = id
    this.name = name
    this.img = img
  }
}

class Contest {
  id
  title
  cardRanks

  constructor(id, title, cardRanks) {
    this.id = id
    this.title = title
    this.cardRanks = cardRanks.map(rank => (
        {
          //card: await getDoc(rank.card).data(),
          id: rank.card,
          rating: rank.rating
        }))
  }

  async getNextMatch(winner, loser) {
    const m = this
    // firebase get all cards
    const allCards = await GetAllCards();
    // get all cards from firebase

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
        filteredRanks.sort((a, b) => b.rating.sigma - a.rating.sigma)
        console.log("sort!", filteredRanks)
        if(except.length > 0) id = filteredRanks[Math.floor(Math.random() * filteredRanks.length)].id
        else {

          // // find the highest sigma (unkown info)
          // const highestSigma = updatedRanks[0].rating.sigma
          // const highestSigmaCards = updatedRanks
          //   .filter(s => s.rating.sigma == highestSigma) // get highestSigma cards only

          // // randomize them
          // highestSigmaCards.sort((_, __) => Math.random() * 0.5)
          // console.log("sort again!", updatedRanks)
          // const highestS

          id = filteredRanks[0].id;
        }
      }

      return allCards.find(c => c.id === id)
    }

    const card1 = GetBestCard();
    const card2 = GetBestCard([card1])

    console.log("picked new cards!", card1, card2)
    return [card1, card2]
  }


  runMatch(winner, loser) {
    const winnerRating = this.getCardRating(winner)
    const loserRating = this.getCardRating(loser)
    const [[newWinnerRating], [newLoserRating]] = rate([[winnerRating], [loserRating]])

    this.updateOrCreateCard(winner, newWinnerRating)
    this.updateOrCreateCard(loser, newLoserRating)
  }

  getCardRating(card) {
    // try getting existing card rating
    const rankedCard = this.cardRanks.find(c => c.id === card.id)
    if (rankedCard != null) return rankedCard.rating

    // return an new rating
    return rating()
  }

  updateOrCreateCard(card, rating) {
    const id = card.id
    const rankedCard = this.cardRanks.find(c => c.id === id);
    if (rankedCard != null) {
      // update existing card
      console.log("updating card", id, card)
      rankedCard.rating = rating

      // update on firebase
    } else {
      const newCard = {
        id, rating
      }
      this.cardRanks.push(newCard)

      console.log("adding card", id, card)

      // create on firebase
    }
  }

}

const mockCards = [
  {
    id: 1,
    img: "/static/img/cards/1.png",
  },
  {
    id: 2,
    img: "/static/img/cards/2.png",
  },
  {
    id: 3,
    img: "/static/img/cards/3.png"
  },
  {
    id: 4,
    img: "/static/img/cards/4.png"
  },
  {
    id: 5,
    img: "/static/img/cards/5.png"
  },
  {
    id: 6,
    img: "/static/img/cards/6.png"
  },
  {
    id: 7,
    img: "/static/img/cards/7.png"
  },
  {
    id: 8,
    img: "/static/img/cards/8.png"
  },
  {
    id: 9,
    img: "/static/img/cards/9.png"
  },
  {
    id: "cvZzlH7RJ5jI4azr9riG",
    img: "/static/img/cards/10.png"
  },
]

const mockCardRanks = [
  {
    card: 1,
    rating: { mu: 20.963, sigma: 8.084 },
  },
  {
    card: 2,
    rating: { mu: 27.795, sigma: 8.263 },
  }
]

const mockContest = new Contest(69, "the nicest card", mockCardRanks)


// Actual execution of stuff
let card1 = null
let card2 = null
let contest = null

const $contestTitle = document.getElementById("contest-title");

const $card1 = document.getElementById("card1");
const $card1Img = document.getElementById("card1-img");
$card1.addEventListener("click", () => {
  contest.runMatch(card1, card2)
  StartRandomContest()
  LogContest()
})

const $card2 = document.getElementById("card2");
const $card2Img = document.getElementById("card2-img");
$card2.addEventListener("click", () => {
  contest.runMatch(card2, card1)
  StartRandomContest()
  LogContest()
})

function LogContest() {
  console.log(contest)
}

async function StartRandomContest() {
  contest = await GetRandomContest();
  [card1, card2] = await contest.getNextMatch();

  $contestTitle.innerHTML = contest.title;
  $card1Img.src = card1.img
  $card2Img.src = card2.img
}

async function GetRandomContest() {

  const ref = collection(db, "contests").withConverter(contestConverter);
  const querySnapshot = await getDocs(ref);
  const contests = [];
  querySnapshot.forEach((doc) => {
    contests.push(doc.data());
  });

  console.log(contests);
  return mockContest
  // return contests[0];
}

async function GetAllCards(){
  const ref = collection(db, "cards").withConverter(cardConverter);
  const querySnapshot = await getDocs(ref);
  const cards = [];
  querySnapshot.forEach((doc) => {
    cards.push(doc.data());
  });
  return mockCards;
}

// Firestore data converter
const contestConverter = {
  toFirestore: (contest) => {
      return {
          name: contest.title,
          cardRanks: contest.cardRanks,
          };
  },
  fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return new Contest(snapshot.id, data.title, data.cardRanks);
  }
};

const cardConverter = {
  toFirestore: (contest) => {
      return {
          name: contest.name,
          img: contest.img
          };
  },
  fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return new Card(snapshot.id, data.name, data.img);
  }
};

StartRandomContest();