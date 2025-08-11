// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-auth.js";
import { getDatabase, ref, set, get, update, onValue } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-database.js";
databaseURL: "https://kmfworkers-default-rtdb.firebaseio.com",
  
// Your config
const firebaseConfig = {
  apiKey: "AIzaSyDOpfGcOaV6SE3Z6hGrB8k_BNKcII6Psyg",
  authDomain: "kmfworkers.firebaseapp.com",
  projectId: "kmfworkers",
  storageBucket: "kmfworkers.firebasestorage.app",
  messagingSenderId: "345856300895",
  appId: "1:345856300895:web:c0b07b90b45f86989b88ea",
  measurementId: "G-M35E3DJD9V"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Auth
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// Database
const db = getDatabase(app);

// All simple exports for use in script.js
export { auth, provider, onAuthStateChanged, signInWithPopup, signOut, db, ref, set, get, update, onValue };
const firebaseConfig = {
  apiKey: "AIzaSyDOpfGcOaV6SE3Z6hGrB8k_BNKcII6Psyg",
  authDomain: "kmfworkers.firebaseapp.com",
  databaseURL: "https://kmfworkers-default-rtdb.firebaseio.com", // <-- ADD THIS LINE!
  projectId: "kmfworkers",
  storageBucket: "kmfworkers.firebasestorage.app",
  messagingSenderId: "345856300895",
  appId: "1:345856300895:web:c0b07b90b45f86989b88ea",
  measurementId: "G-M35E3DJD9V"
};

