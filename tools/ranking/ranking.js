import { rating, rate, ordinal } from '/static/lib/openskill.js/index.js'
import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js'
import { collection, getFirestore, getDocs, doc, updateDoc, addDoc, arrayUnion   } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-firestore.js'

import {Contest, Match} from '../contest.js'

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

// Actual execution of stuff
let card1 = null
let card2 = null
let contest = null

const $contestTitle = document.getElementById("contest-title");
const $contestResults = document.getElementById("contest-results");
const $cardMatch = document.getElementById("card-match");

let showRatings = false
const $toggleMatch = document.getElementById("toggle-match")
$toggleMatch.addEventListener("click", e => {
  showRatings = !showRatings
  $contestResults.classList.toggle("hidden", !showRatings)
  $cardMatch.classList.toggle("hidden", showRatings)
  $toggleMatch.innerHTML = showRatings
    ? "back to match"
    : "show ratings"
})

const $contestSelect = document.getElementById("contest-select");
$contestSelect.addEventListener("change", event => {
  const contestTitle = $contestSelect.value
  SetContestByTitle(contestTitle)
  RunContest()
})

const $btn_contest_add = document.getElementById("add-contest");
const $contest_name = document.getElementById("contest-name");
$btn_contest_add.addEventListener("click", () => {
  if ($contest_name.value)
    CreateContest($contest_name.value)
})

const $currentContest = document.getElementById("current-contest");

const $card1 = document.getElementById("card1");
const $card1Img = document.getElementById("card1-img");
$card1.addEventListener("click", () => {
  RunMatchForContestAndUpdate(card1, card2)
})

const $card2 = document.getElementById("card2");
const $card2Img = document.getElementById("card2-img");
$card2.addEventListener("click", () => {
  RunMatchForContestAndUpdate(card2, card1)
})

function RunMatchForContestAndUpdate(winner, loser) {
  const m = new Match(winner.id, loser.id)
  contest.addMatch(m)
  contest.runMatch(m)
  UpdateContestMatches(contest, m);
  RenderContestData(contest)
  RunContest()
}

async function RunRandomContest() {
  contest = contests[Math.floor(Math.random() * contests.length)];
  $contestSelect.value = contest.title
  RenderContestData(contest)
  await RunContest()
}

async function RunContest(){
  [card1, card2] = await contest.getNextMatch(allCards);
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
  for (let contest of contests) {
    const title = contest.title;
    const $option = document.createElement("option")
    $option.value = contest.title
    $option.innerText = `${contest.title} (${contest.cardMatches.length})`

    $contestSelect.appendChild($option)
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
    // createTextCell("mu", rating.mu.toFixed(2))
    // createTextCell("sigma", rating.sigma.toFixed(2))

    for(let c of contests) {
      if(c.title === contest.title) continue
      const r = c.cardRanks[i].rating
      createTextCell(`rating (${c.title})`, ordinal(r).toFixed(2))
    }
  }

  $currentContest.appendChild($table);
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
      cardMatches: arrayUnion({winner: match.winner, loser: match.loser})
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

let allCards = null
async function main() {
  await GetContests();
  allCards = await GetAllCards();
  RunRandomContest();
}

main()
