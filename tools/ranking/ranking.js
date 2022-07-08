import { rating, rate, ordinal } from '/static/lib/openskill.js/index.js'
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js'
import { collection, getFirestore, getDocs, doc, updateDoc, addDoc, arrayUnion   } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-firestore.js'

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
const contests = [];

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
  cardMatches

  constructor(id, title, cardRanks, cardMatches) {
    this.id = id
    this.title = title
    this.cardRanks = cardRanks.map(rank => (
        {
          id: rank.id,
          rating: rank.rating
        }))
    if (!cardMatches) return;
    this.cardMatches = cardMatches.map(match => (
        {
          winner: match.winner,
          loser: match.loser
        }))
  }

  async getNextMatch(winner, loser) {
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
        filteredRanks.sort((a, b) => b.rating.sigma - a.rating.sigma)
        //console.log("sort!", filteredRanks)
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

   // console.log("picked new cards!", card1, card2)
    return [card1, card2]
  }


  runMatch(winner, loser) {
    const match = {
      winner: winner.id,
      loser: loser.id
    }
    if (this.cardMatches == null){
      this.cardMatches = [match];
    }else{
      this.cardMatches.push(match);
    }
    const winnerRating = this.getCardRating(winner)
    const loserRating = this.getCardRating(loser)
    const [[newWinnerRating], [newLoserRating]] = rate([[winnerRating], [loserRating]])

    this.updateOrCreateCard(winner, newWinnerRating)
    this.updateOrCreateCard(loser, newLoserRating)

    UpdateContestMatches(this,match);
    //UpdateContest(this)
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
      console.log("updating card", id, card)
      rankedCard.rating = rating
    } else {
      const newCard = {
        id, rating
      }
      this.cardRanks.push(newCard)
      console.log("adding card", id, card)
    }
  }

}

// const mockCards = [
//   {
//     id: 1,
//     img: "/static/img/cards/1.png",
//   },
//   {
//     id: 2,
//     img: "/static/img/cards/2.png",
//   },
//   {
//     id: 3,
//     img: "/static/img/cards/3.png"
//   },
//   {
//     id: 4,
//     img: "/static/img/cards/4.png"
//   },
//   {
//     id: 5,
//     img: "/static/img/cards/5.png"
//   },
//   {
//     id: 6,
//     img: "/static/img/cards/6.png"
//   },
//   {
//     id: 7,
//     img: "/static/img/cards/7.png"
//   },
//   {
//     id: 8,
//     img: "/static/img/cards/8.png"
//   },
//   {
//     id: 9,
//     img: "/static/img/cards/9.png"
//   },
//   {
//     id: "cvZzlH7RJ5jI4azr9riG",
//     img: "/static/img/cards/10.png"
//   },
// ]

// const mockCardRanks = [
//   {
//     id: 1,
//     rating: { mu: 20.963, sigma: 8.084 },
//   },
//   {
//     id: 2,
//     rating: { mu: 27.795, sigma: 8.263 },
//   }
// ]

// const mockContest = new Contest(69, "the nicest card", mockCardRanks)


// Actual execution of stuff
let card1 = null
let card2 = null
let contest = null

const $contestTitle = document.getElementById("contest-title");

// const $btn = document.getElementById("debugButton");
// const $txt = document.getElementById("text");
// $btn.addEventListener("click", () => {
//   CreateCard($txt.value)
// })

const $btn_contest_add = document.getElementById("add-contest");
const $contest_name = document.getElementById("contest-name");
$btn_contest_add.addEventListener("click", () => {
  if ($contest_name.value)
    CreateContest($contest_name.value)
})

const $contestList = document.getElementById("contest-list");
const $currentContest = document.getElementById("current-contest");

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
  console.log("LOGGIN CONTEST")
  console.log(contest)
  console.log("-----------")
}

async function StartRandomContest() {
  contest = await GetRandomContest();
  [card1, card2] = await contest.getNextMatch();

  $contestTitle.innerHTML = contest.title;
  $card1Img.src = card1.img
  $card2Img.src = card2.img
}

async function StartContest(contest){
  //this await makes no sense, but it otherwise breaks
  contest = await contests.find(c => c.title === contest);
  [card1, card2] = await contest.getNextMatch();
  $contestTitle.innerHTML = contest.title;
  $card1Img.src = card1.img
  $card2Img.src = card2.img
}

async function GetContests(){
  const ref = collection(db, "contests").withConverter(contestConverter);
  const querySnapshot = await getDocs(ref);
  querySnapshot.forEach((doc) => {
    contests.push(doc.data());
  });
  for (var i in contests) {
    var anchor = document.createElement("a");
    anchor.innerText = contests[i].title;
    var elem = document.createElement("li");
    elem.appendChild(anchor);
    anchor.addEventListener("click", event => {
      SetAsCurrent(event.target.innerText)
      StartContest(event.target.innerText)
    })
    $contestList.appendChild(elem);
  }
}

function SetAsCurrent(contest){
  var currentContest = contests.find(c => c.title === contest)
  while ($currentContest.firstChild) {
    $currentContest.removeChild($currentContest.lastChild);
  }
  for (var i in currentContest.cardRanks) {
    var anchor = document.createElement("img");
    anchor.src = allCards.find(c => c.id === currentContest.cardRanks[i].id).img ;
    var elem = document.createElement("li");
    elem.appendChild(anchor);
    $currentContest.appendChild(elem);
  }
  //replaceChildren(...arrayOfNewChildren)
}

function GetRandomContest() {
  return contests[Math.floor(Math.random() * contests.length)];
}

async function GetAllCards(){
  const ref = collection(db, "cards").withConverter(cardConverter);
  const querySnapshot = await getDocs(ref);
  const cards = [];
  querySnapshot.forEach((doc) => {
    cards.push(doc.data());
  });
  return cards;
}

async function UpdateContest(contest){
  const cardRef = doc(db, "contests", `${contest.id}`);
  await updateDoc(cardRef, {
      title: contest.title,
      cardRanks: contest.cardRanks,
      cardMatches: contest.cardMatches
  });
}

async function UpdateContestMatches(contest,match){
  const cardRef = doc(db, "contests", `${contest.id}`);
  await updateDoc(cardRef, {
      cardMatches: arrayUnion(match)
  });
}

async function CreateContest(contest){
  const ref = collection(db, "contests").withConverter(contestConverter);
  await addDoc(ref, {title:contest, cardRanks:[], cardMatches:[]});
}


async function UpdateCard(card){
  const cardRef = doc(db, "cards", card.id);
  await updateDoc(cardRef, {
    img:card.img, 
    name:card.name
  });
}

async function CreateCard(card){
  const docRef = await addDoc(collection(db, "cards"), {
    name: card,
    img: "/static/img/cards/"+card+".png"
  });
}


// Firestore data converters

// Contest Converter
const contestConverter = {
  toFirestore: (contest) => {
      return {
          title: contest.title,
          cardRanks: contest.cardRanks,
          cardMatches: contest.cardMatches
          };
  },
  fromFirestore: (snapshot, options) => {
      const data = snapshot.data(options);
      return new Contest(snapshot.id, data.title, data.cardRanks, data.cardMatches);
  }
};

// Card Converter
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

await GetContests();
const allCards = await GetAllCards();
StartRandomContest();
