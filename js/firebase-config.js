// ===== FIREBASE CONFIGURATION =====
const firebaseConfig = {
    apiKey: "AIzaSyDHXIlqT7WegclHVbAn1hu9bGYptsnz4mo",
    authDomain: "construction-web-app-c11c3.firebaseapp.com",
    databaseURL: "https://construction-web-app-c11c3-default-rtdb.firebaseio.com",
    projectId: "construction-web-app-c11c3",
    storageBucket: "construction-web-app-c11c3.firebasestorage.app",
    messagingSenderId: "217029690839",
    appId: "1:217029690839:web:e0af19b58d7ef4085bf792",
    measurementId: "G-7XRP7ERDEE"
};

// Initialize Firebase (only once)
if (!firebase.apps || !firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

const db = firebase.database();