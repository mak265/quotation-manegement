import { initializeApp } from 'firebase/app'
import {getFirestore} from 'firebase/firestore'
import {getAuth} from 'firebase/auth'

const firebaseConfig = {
  apiKey: "AIzaSyA7TBOKtl7ASq8GNeODoAELlCTip25cM74",
  authDomain: "fwds-pos-management.firebaseapp.com",
  projectId: "fwds-pos-management",
  storageBucket: "fwds-pos-management.firebasestorage.app",
  messagingSenderId: "609810141574",
  appId: "1:609810141574:web:e7e827a6b7e14bbe6e5c07",
  measurementId: "G-L5CEZ2PWVW",
  db: "https://fwds-pos-management-default-rtdb.firebaseio.com"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)

export default app