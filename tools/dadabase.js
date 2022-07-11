import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-app.js'
import { collection, getFirestore, getDocs, doc, updateDoc, addDoc, getDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/9.8.4/firebase-firestore.js'

import Card from "./card.js"
import { Contest, Match } from './contest.js'

const firebaseConfig = {

    apiKey: "AIzaSyBlTsXWbJlWlyZ9hcfKLSw2WETFjBvnhRo",

    authDomain: "dadada-12228.firebaseapp.com",

    projectId: "dadada-12228",

    storageBucket: "dadada-12228.appspot.com",

    messagingSenderId: "349029071019",

    appId: "1:349029071019:web:e29259ffea1bb733291fee"

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
        return new Card(snapshot.id, data.name, data.img, data.tags);
    }
};

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

class Dadabase {
  db
  constructor() {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
  }

  async updateContest(contest){
    const cardRef = doc(this.db, "contests", `${contest.id}`);
    await updateDoc(cardRef, {
        title: contest.title,
        cardRanks: contest.cardRanks,
        cardMatches: contest.cardMatches
    });
  }

  async updateContestMatches(contest, match){
    const cardRef = doc(this.db, "contests", `${contest.id}`);
    await updateDoc(cardRef, {
        cardMatches: arrayUnion({winner: match.winner, loser: match.loser})
    });
  }

  async createContest(contest){
    const ref = collection(this.db, "contests").withConverter(contestConverter)
    await addDoc(ref, {title:contest, cardRanks:[], cardMatches:[]})
  }

  async getContests() {
    const ref = collection(this.db, "contests").withConverter(contestConverter)
    const querySnapshot = await getDocs(ref)

    const contests = []
    querySnapshot.forEach((doc) => {
      contests.push(doc.data())
    })

    return contests
  }

  async createCard(card){
    const docRef = await addDoc(collection(this.db, "cards"), {
      name: card,
      img: `/static/img/cards/${card}.png`
    });
  }

  async getAllCards(showArchived = false) {
    const ref = collection(this.db, "cards").withConverter(cardConverter);
    const querySnapshot = await getDocs(ref);
    const cards = [];
    querySnapshot.forEach((doc) => {
      cards.push(doc.data());
    })
    return cards.filter(c => !c.tags.has("archived"))
  }

  async updateCard(card){
    const cardRef = doc(this.db, "cards", card.id);
    await updateDoc(cardRef, {
      img:card.img,
      name:card.name
    });
  }
}

export default new Dadabase()

