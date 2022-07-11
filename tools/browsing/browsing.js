import ddb from '../dadabase.js'

const $cardList = document.getElementById("card-list")
const $filter = document.getElementById("filter")
$filter.addEventListener("change", () => {
  Filter($filter.value.trim().split(" "))
})

function Filter(tags) {
  $cardList.childNodes.forEach($c => {
    $c.style.display = "block"
    tags.forEach(t => {
      $c.style.display =
        $c.classList.contains(`tag-${t}`)
        ? "block"
        : "none"
    })
  })

}

function InitializeCards(cards) {
  while ($cardList.lastChild) {
    $cardList.removeChild($cardList.lastChild);
  }

  cards.forEach(c => {
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
  const cards = await ddb.getAllCards()
  InitializeCards(cards)
}
main()