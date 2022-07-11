import { rating, rate, ordinal } from '/static/lib/openskill.js/index.js'

import { Contest, Match } from '../contest.js'
import Card from '../card.js'

import ddb from '../dadabase.js'

let contests = [];

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
  StartContest()
})

const $btn_contest_add = document.getElementById("add-contest");
const $contest_name = document.getElementById("contest-name");
$btn_contest_add.addEventListener("click", async () => {
  const title = $contest_name.value
  if (title) {
    await ddb.createContest(title)
    await GetContests()
    SetContestByTitle(title)
    StartContest()
  }
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
  ddb.updateContestMatches(contest, m);
  RenderContestData(contest)
  StartContest()
}

async function RunRandomContest() {
  const title = contests[Math.floor(Math.random() * contests.length)].title
  SetContestByTitle(title)
  RenderContestData(contest)
  await StartContest()
}

async function StartContest(){
  [card1, card2] = await contest.getNextMatch(allCards);
  $contestTitle.innerHTML = contest.title;
  $card1Img.src = card1.img
  $card2Img.src = card2.img
}

async function SetContestByTitle(title) {
  contest = contests.find(c => c.title === title)
  window.location.hash = title
  $contestSelect.value = contest.title
  RenderContestData(contest)
}


async function GetContests(){
  contests = await ddb.getContests()

  while ($contestSelect.lastChild) {
    $contestSelect.removeChild($contestSelect.lastChild);
  }

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

    const $link = document.createElement("a")
    $link.href = `../tagging#${card.name}`
    const $img = document.createElement("img")
    $img.src = card.img

    $link.appendChild($img)
    createTextCell("rank", i)
    createCell("image", $link)

    // createTextCell("name", card.name)

    const rating = contest.cardRanks[i].rating
    createTextCell("rating", ordinal(rating).toFixed(2))
    // createTextCell("mu", rating.mu.toFixed(2))
    // createTextCell("sigma", rating.sigma.toFixed(2))

    for(let c of contests.filter(c => c.cardRanks)) {
      if(c.title === contest.title) continue
      const r = c.cardRanks.find(r => r.id === card.id)
      const value = (r && ordinal(r.rating).toFixed(2)) || "---"
      createTextCell(`rating (${c.title})`, value)
    }
  }

  $currentContest.appendChild($table);
}

let allCards = null
async function main() {
  await GetContests();
  allCards = await ddb.getAllCards();
  const hash = window.location.hash.slice(1).replaceAll("%20", " ")
  const contest = contests.find(c => c.title === hash)
  if(contest) {
    SetContestByTitle(contest.title)
    StartContest()
  } else {
    RunRandomContest()
  }

  console.log(hash)
}

main()
