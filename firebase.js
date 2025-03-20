const firebaseConfig = {
  apiKey: "AIzaSyBmEuZmzHtsyXzOQhSWUGPu6c3uRUJC6VY",
  authDomain: "todo-app-new-3e900.firebaseapp.com",
  projectId: "todo-app-new-3e900",
  storageBucket: "todo-app-new-3e900.firebasestorage.app",
  messagingSenderId: "264571526135",
  appId: "1:264571526135:web:260c5314ab20234cd36cf2",
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore
const db = firebase.firestore();

console.log("Firebase initialized successfully");
