import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Paste your Firebase config below from your Firebase Console
const firebaseConfig = {
    apiKey: "AIzaSyCM6X5iOfPPD3pPRkDm9NRd3vl0am72D3A",
    authDomain: "temp-email-credentials.firebaseapp.com",
    projectId: "temp-email-credentials",
    storageBucket: "temp-email-credentials.firebasestorage.app",
    messagingSenderId: "1058543669134",
    appId: "1:1058543669134:web:c5d48014c7e039c28a1edf"

};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };