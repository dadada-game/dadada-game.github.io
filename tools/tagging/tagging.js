import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js'
import { collection, getFirestore, getDocs, doc, updateDoc, addDoc, getDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-firestore.js'

import Card from "../card.js"

const firebaseConfig = {

    apiKey: "AIzaSyBlTsXWbJlWlyZ9hcfKLSw2WETFjBvnhRo",

    authDomain: "dadada-12228.firebaseapp.com",

    projectId: "dadada-12228",

    storageBucket: "dadada-12228.appspot.com",

    messagingSenderId: "349029071019",

    appId: "1:34902907101!9:web:e29259ffea1bb733291fee"

};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

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
$submit.addEventListener("click", e => {
    const tag = $tag.value.toLowerCase()
    TagCard(tag);
    RefreshCard();
    if (!allTags.has(tag)) {
        AddTag(tag);
    }
})

async function GetAllCards() {
    const ref = collection(db, "cards").withConverter(cardConverter);
    const querySnapshot = await getDocs(ref);
    const cards = [];
    querySnapshot.forEach((doc) => {
        cards.push(doc.data());
    });
    cards.forEach((card) => {
        const $option = document.createElement("option")
        $option.value = card.name
        $option.innerText = card.name
        $dropdownCard.append($option);
    }
    );
    return cards;
}

function RefreshCard(){
    $cardImage.src = currentCard.img;
    $cardTags.innerText ='';
    currentCard.tags?.forEach((tag) => {
        const $tag = $CreateElement(TagTemplate(tag));
        $cardTags.appendChild($tag)
        const $delete = $tag.querySelector(`#card-tag-delete-${tag}`)
        $delete.addEventListener("click", async () => {
            await RemoveCardTag(currentCard, tag)
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

async function GetAllTags() {
    const querySnapshot = await getDoc(doc(db, "cardTags", "tags"));
    const tags = querySnapshot.data().list;
    tags.forEach((tag) => {
        const $option = document.createElement("option")
        $option.value = tag
        $option.innerText = tag
        $dropdownSelect.append($option);
    }
    );
    return tags;
}


async function UpdateCard(card) {
    const cardRef = doc(db, "cards", card.id);
    await updateDoc(cardRef, {
        img: card.img,
        name: card.name
    });
}

async function CreateCard(card) {
    const docRef = await addDoc(collection(db, "cards"), {
        name: card,
        img: "/static/img/cards/" + card + ".png"
    });
}

async function AddTag(tag) {
    const tagRef = doc(db, "cardTags", "tags");
    await updateDoc(tagRef, {
        list: arrayUnion(tag)
    });

    allTags.add(tag)
}

async function RemoveCardTag(card, tag) {
    const cardRef = doc(db, "cards", card.id);
    if (card.tags)
        currentCard.tags.delete(tag);
    await updateDoc(cardRef, {
        tags: arrayRemove(tag)
    });
}

async function TagCard(tag){
    const cardRef = doc(db, "cards", currentCard.id);
    if (currentCard.tags)
        currentCard.tags.add(tag);
    else
        currentCard.tags = new Set([tag]);
    await updateDoc(cardRef, {
        tags: arrayUnion(tag)
    });
}


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
        return new Card(snapshot.id, data.name, data.img, data.tags);
    }
};

let allCards = null;
let allTags = new Set();
let currentCard = null;
function SetCurrentCard(card) {
    $dropdownCard.value = card.name;
    window.location.hash = card.name
    currentCard = card
}

async function main() {
    allCards = await GetAllCards();
    allTags = new Set(await GetAllTags());

    let hashCard = null
    const hash = window.location.hash.slice(1)
    console.log(hash)
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
