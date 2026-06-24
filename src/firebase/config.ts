import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyB-Q84p6oRGkrasR8wPxwSTkKjuU3qiyyI',
  authDomain: 'balanceum-kontor.firebaseapp.com',
  projectId: 'balanceum-kontor',
  storageBucket: 'balanceum-kontor.firebasestorage.app',
  messagingSenderId: '769755178241',
  appId: '1:769755178241:web:7424d51df7eb7a3a742700',
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
