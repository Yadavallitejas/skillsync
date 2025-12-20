import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD2buWrttW99ITN-nVogXqi-z3MyHCY7QA",
  authDomain: "skillsync-7e903.firebaseapp.com",
  projectId: "skillsync-7e903",
  storageBucket: "skillsync-7e903.firebasestorage.app",
  messagingSenderId: "687445917594",
  appId: "1:687445917594:web:8e3f3029201091f8278423",
  measurementId: "G-GQ07EW05HV"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;

