import ddb from "../dadabase.js"

const $cardImage = document.getElementById("card-img");
const $dropdownCard = document.getElementById("card-select");
$dropdownCard.addEventListener("change", event => {
    SetCurrentCard(allCards.find(c => c.name === $dropdownCard.value))
    RefreshCard();
})

const $cardTags = document.getElementById("card-tags");

const $dropdownSelect = document.getElementById("select-tag");
$dropdownSelect.addEventListener("change", () => {
    $tag.value = $dropdownSelect.value;
    $tag.focus()
})

const $tag = document.getElementById("tag-value");
const $submit = document.getElementById("submit");
$submit.addEventListener("click", async e => {
    const tag = $tag.value.toLowerCase()
    await TagCard(currentCard, tag);
    RefreshCard();
    if (!allTags.has(tag)) {
        AddTag(tag);
    }
})

function RefreshCard(){
    $cardImage.src = currentCard.img;
    $cardTags.innerText ='';
    currentCard.tags?.forEach((tag) => {
        const $tag = $CreateElement(TagTemplate(tag));
        $cardTags.appendChild($tag)
        const $delete = $tag.querySelector(`#card-tag-delete-${tag}`)
        $delete.addEventListener("click", async () => {
            await ddb.removeCardTag(currentCard, tag)
            if (currentCard.tags)
                currentCard.tags.delete(tag);

            RefreshCard()
        })
    })
}

function $CreateElement(html) {
    const placeholder = document.createElement("div");
    placeholder.innerHTML = html;
    return placeholder.firstElementChild;
}

function TagTemplate(tag) {
    return `
<div class="card-tag">
    <span class="card-tag-text">${tag}</span>
    <span class="card-tag-delete" id="card-tag-delete-${tag}">🗑️</span>
</div>`
}

async function AddTag(tag) {
    await ddb.addTag(tag)
    allTags.add(tag)
    RenderTags(allTags)
}

async function TagCard(card, tag){
    await ddb.addTagToCard(card, tag)

    if (card.tags)
        card.tags.add(tag);
    else
        card.tags = new Set([tag]);

    RenderCardOptions(allCards)
    RenderTags(allTags)
}

let allTags = new Set();
let currentCard = null;
let allCards = null;

function SetCurrentCard(card) {
    $dropdownCard.value = card.name;
    window.location.hash = card.name
    currentCard = card
}

function RenderCardOptions(cards) {
    // render options
    const v = $dropdownCard.value

    while($dropdownCard.lastChild) {
        $dropdownCard.removeChild($dropdownCard.lastChild)
    }

    cards.forEach((card) => {
        const $option = document.createElement("option")
        $option.value = card.name
        $option.innerText = `${card.name} (${card.tags.size})`
        $dropdownCard.append($option);
    })
    $dropdownCard.value = v
}

function RenderTags(tags) {
    const sortedTags = Array.from(tags)
    sortedTags.sort()

    while($dropdownSelect.lastChild) {
        $dropdownSelect.removeChild($dropdownSelect.lastChild)
    }

    sortedTags.forEach((tag) => {
        const $option = document.createElement("option")
        $option.value = tag
        $option.innerText = tag
        $dropdownSelect.append($option);
    });
}

async function main() {
    allCards = (await ddb.getAllCards()).filter(c => !c.tags.has("archived"))
    allCards.sort((a, b) => a.tags.size - b.tags.size)

    RenderCardOptions(allCards)

    allTags = new Set(await ddb.getAllTags());

    RenderTags(allTags)


    let hashCard = null
    const hash = window.location.hash.slice(1)
    // if has hash, get that card
    if(hash) {
        hashCard = allCards.find(c => c.name === hash)
    }

    if (!hashCard) {
        hashCard = allCards[Math.floor(Math.random() * allCards.length)];
    }

    SetCurrentCard(hashCard)

    RefreshCard();
}
main()
