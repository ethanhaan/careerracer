// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add other Firebase services that you need here

// Go to your Firebase project console > Project settings > General
// And grab your web app's Firebase configuration.
const firebaseConfig = {
    apiKey: "AIzaSyBY3T4pJuFwX3AWOoMvsJNxZ3qEz8YwJpg",
    authDomain: "careerracer.firebaseapp.com",
    projectId: "careerracer",
    storageBucket: "careerracer.firebasestorage.app",
    messagingSenderId: "526698390404",
    appId: "1:526698390404:web:d5affa4b46071c6f58b3d1",
    measurementId: "G-EFRS1LGWY1"
  };

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

export { db, auth, provider };
