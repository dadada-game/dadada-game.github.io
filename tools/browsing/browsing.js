import ddb from '../dadabase.js'

const $cardList = document.getElementById("card-list")
const $filter = document.getElementById("filter")
const $selectTag = document.getElementById("select-tag")
const $tagContainer = document.getElementById("tag-container")

$selectTag.addEventListener("change", () => {
  $filter.value = $selectTag.value;
  if ($filter.value === "") return;
  tags.push(...$filter.value.trim().split(" "));
  $filter.value = "";
  Filter()
  RefreshTags()
})

let tags = [];
let allTags = new Set();
let allCards = null;
let filteredCards = null;

function TagTemplate(tag) {
  return `
<div class="card-tag">
  <span class="card-tag-text">${tag}</span>
  <span class="card-tag-delete" id="card-tag-delete-${tag}">✖</span>
</div>`
}


$filter.addEventListener("change", () => {
  if ($filter.value === "") return;
  tags.push(...$filter.value.trim().split(" "));
  $filter.value = "";
  Filter()
  RefreshTags()
})

function RefreshTags() {
  $tagContainer.innerText = '';
  tags?.forEach((tag) => {
    const $tag = $CreateElement(TagTemplate(tag));
    $tagContainer.appendChild($tag)
    const $delete = $tag.querySelector(`#card-tag-delete-${tag}`)
    $delete.addEventListener("click", () => {
      tags = tags.filter((val) => { return val != tag });
      Filter()
      RefreshTags()
    })
  })
}

function $CreateElement(html) {
  const placeholder = document.createElement("div");
  placeholder.innerHTML = html;
  return placeholder.firstElementChild;
}


function Filter() {
  if (tags.length == 0) {
    filteredCards = allCards;
  } else {
    filteredCards = allCards.filter(
      (card) => {
        var hasTag = false;
        tags.forEach(
          (tag) => {
            if (card.tags.has(tag)) {
              hasTag = true;
            } else {
            }
          })
        return hasTag;
      }
    )
  }
  InitializeCards();
}

function RenderTags(tags) {
  const sortedTags = Array.from(tags)
  sortedTags.sort()

  while ($selectTag.lastChild) {
    $selectTag.removeChild($selectTag.lastChild)
  }

  sortedTags.forEach((tag) => {
    const $option = document.createElement("option")
    $option.value = tag
    $option.innerText = tag
    $selectTag.append($option);
  });
}


function InitializeCards() {
  while ($cardList.lastChild) {
    $cardList.removeChild($cardList.lastChild);
  }

  filteredCards.forEach(c => {
    const $card = document.createElement("div")
    $card.classList.toggle("card", true)
    for (let t of c.tags) {
      $card.classList.toggle(`tag-${t}`, true)
    }
    const $img = document.createElement("img")
    $img.src = c.img

    const $a = document.createElement("a")

    $a.href = `../tagging#${c.name}`
    $a.appendChild($img)
    $card.appendChild($a)

    $cardList.appendChild($card)
  })
}


async function main() {
  allCards = (await ddb.getAllCards()).filter(c => !c.tags.has("archived"))
  filteredCards = allCards;
  allTags = new Set(await ddb.getAllTags());

  RenderTags(allTags)
  InitializeCards()
}

main()