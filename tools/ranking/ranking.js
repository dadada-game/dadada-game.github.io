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


class Match {
  winner
  loser

  constructor(winner, loser) {
    this.winner = winner
    this.loser = loser
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
    // UpdateContest(this)
  }

  addMatch(match) {
    const m = { winner: match.winner, loser: match.loser }
    if (this.cardMatches == null){
      this.cardMatches = [m];
    } else {
      this.cardMatches.push(m);
    }

    UpdateContestMatches(this, m);
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

// Actual execution of stuff
let card1 = null
let card2 = null
let contest = null

const $contestTitle = document.getElementById("contest-title");

const $contestList = document.getElementById("contest-list");
const $currentContest = document.getElementById("current-contest");

const $card1 = document.getElementById("card1");
const $card1Img = document.getElementById("card1-img");
$card1.addEventListener("click", () => {
  const m = new Match(card1.id, card2.id)
  contest.addMatch(m)
  contest.runMatch(m)
  RenderContestData(contest)
  RunContest()
})

const $card2 = document.getElementById("card2");
const $card2Img = document.getElementById("card2-img");
$card2.addEventListener("click", () => {
  const m = new Match(card2.id, card1.id)
  contest.addMatch(m)
  contest.runMatch(m)
  RenderContestData(contest)
  RunContest()
})

async function RunRandomContest() {
  contest = contests[Math.floor(Math.random() * contests.length)];
  RenderContestData(contest)
  await RunContest()
}

async function RunContest(){
  [card1, card2] = await contest.getNextMatch();
  $contestTitle.innerHTML = contest.title;
  $card1Img.src = card1.img
  $card2Img.src = card2.img
}

async function SetContestByTitle(title) {
  contest = contests.find(c => c.title === title)
  RenderContestData(contest)
}

async function GetContests(){
  const ref = collection(db, "contests").withConverter(contestConverter);
  const querySnapshot = await getDocs(ref);
  querySnapshot.forEach((doc) => {
    contests.push(doc.data());
  });

  // render them
  for (let i in contests) {
    const $anchor = document.createElement("a");
    $anchor.classList.toggle("contest-select")
    $anchor.innerText = contests[i].title;
    const $elem = document.createElement("li");
    $elem.appendChild($anchor);
    $anchor.addEventListener("click", event => {
      const contestTitle = event.target.innerText
      SetContestByTitle(contestTitle)
      RunContest()
    })
    $contestList.appendChild($elem);
  }
}

function RenderContestData(contest){
  while ($currentContest.firstChild) {
    $currentContest.removeChild($currentContest.lastChild);
  }

  const $table = document.createElement("table");
  const $thead = document.createElement("thead");
  $table.appendChild($thead)
  const $headrow = document.createElement("tr");
  $thead.appendChild($headrow)
  $table.classList.toggle("contest-table", true)

  const headers = {}

  contest.cardRanks.sort((a, b) => ordinal(b.rating) - ordinal(a.rating))
  for (let i in contest.cardRanks) {
    const $row = document.createElement("tr");
    $row.classList.toggle("contest-row", true)
    $table.appendChild($row);

    function createCell(header, $child)
    {
      const $cell = document.createElement("td")
      if(headers[header] == null) {
        headers[header] = true
        const $headcell = document.createElement("th")
        $headcell.innerHTML = header
        $headrow.appendChild($headcell)
      }
      $cell.classList.toggle("contest-cell", true)
      $cell.appendChild($child)
      $row.appendChild($cell)
    }

    function createTextCell(header, text) {
      const $el = document.createElement("span")
      $el.innerHTML = text
      createCell(header, $el)
    }

    const card = allCards.find(c => c.id === contest.cardRanks[i].id)

    const $img = document.createElement("img")
    $img.src = card.img
    createTextCell("rank", i)
    createCell("image", $img)

    createTextCell("name", card.name)

    const rating = contest.cardRanks[i].rating
    createTextCell("rating", ordinal(rating).toFixed(2))
    createTextCell("mu", rating.mu.toFixed(2))
    createTextCell("sigma", rating.sigma.toFixed(2))
  }

  $currentContest.appendChild($table);
  //replaceChildren(...arrayOfNewChildren)
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

async function UpdateContestMatches(contest, match){
  const cardRef = doc(db, "contests", `${contest.id}`);
  await updateDoc(cardRef, {
      cardMatches: arrayUnion(match)
  });
}

async function CreateContest(contest){
  const ref = collection(db, "contests").withConverter(contestConverter);
  await addDoc(ref, contest);
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

let allCards = null
async function main() {
  await GetContests();
  allCards = await GetAllCards();
  RunRandomContest();
}

main()
