// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyA9_4l76UeyoXphdn-eYQILWaKrXcYbuzI",
  authDomain: "skill-path-0001.firebaseapp.com",
  projectId: "skill-path-0001",
  storageBucket: "skill-path-0001.firebasestorage.app",
  messagingSenderId: "731687537564",
  appId: "1:731687537564:web:7e9beb7f10c110095e9659",
  measurementId: "G-2DGXB09X7W"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);getAnalytics(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
