import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyAN5cJPoHqB5B6VP4_KPyzxxQG2Mf0olOo",
    authDomain: "hiremind-c0ad0.firebaseapp.com",
    projectId: "hiremind-c0ad0",
    storageBucket: "hiremind-c0ad0.appspot.com",
    messagingSenderId: "159784617269",
    appId: "1:159784617269:web:9ba3b7befecbc26846b87c"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = 'hiremind-c0ad0';

export { auth, db, appId };
