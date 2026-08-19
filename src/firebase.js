import { initializeApp, getApps, getApp } from 'firebase/app'
import { getFirestore, collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, where, getDocs, getDoc } from 'firebase/firestore'
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, GoogleAuthProvider, signInWithPopup } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyC5IobmWltEfZBIAcZ9x0vvfYBL-lSzv7g",
  authDomain: "anant-medicare.firebaseapp.com",
  projectId: "anant-medicare",
  storageBucket: "anant-medicare.firebasestorage.app",
  messagingSenderId: "954558350104",
  appId: "1:954558350104:web:2d9f246f10bc77e9c9d46d"
}

// Guard against Vite HMR re-initializing Firebase multiple times (causes INTERNAL ASSERTION FAILED)
const app = getApps().length ? getApp() : initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)
export const googleProvider = new GoogleAuthProvider()

export { collection, addDoc, updateDoc, doc, deleteDoc, onSnapshot, query, where, getDocs, getDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged, signInWithPopup }