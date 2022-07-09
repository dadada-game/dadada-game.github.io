import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js'
import { collection, getFirestore, getDocs, doc, updateDoc, addDoc, getDoc, arrayUnion } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-firestore.js'

import Card from "../card.js"

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

const $cardImage = document.getElementById("card-img");
const $dropdownCard = document.getElementById("card-select");
$dropdownCard.addEventListener("change", event => {
    currentCard = allCards.find(c => c.name === $dropdownCard.value)
    RefreshCard();
})

const $cardTags = document.getElementById("card-tags");

const $dropdownSelect = document.getElementById("select-tag");
$dropdownSelect.addEventListener("change", () => {
    $tag.value=$dropdownSelect.value;
    $tag.focus()
})

const $tag = document.getElementById("tag-value");
const $submit = document.getElementById("submit");
$submit.addEventListener("click", e => {
    TagCard($tag.value);
    RefreshCard();
    if (allTags.indexOf($tag.value) == -1)
        AddTag($tag.value);
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
        $cardTags.innerText = $cardTags.innerText +" "+tag;
    })
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
}

async function TagCard(tag){
    const cardRef = doc(db, "cards", currentCard.id);
    if (currentCard.tags)
        currentCard.tags.push(tag);
    else
        currentCard.tags = [tag];
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
let allTags = null;
let currentCard = null;
async function main() {
    allCards = await GetAllCards();
    allTags = await GetAllTags();
    currentCard = allCards[Math.floor(Math.random() * allCards.length)];
    $dropdownCard.value = currentCard.name;
    RefreshCard();
}
main()
