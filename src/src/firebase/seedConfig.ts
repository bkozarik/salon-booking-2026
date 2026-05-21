import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'AIzaSyCaV64y5EgZH_wiy53Qe6tY9R0oVlc_7xY',
  authDomain: 'salon-booking-2026-fb245.firebaseapp.com',
  projectId: 'salon-booking-2026-fb245',
})

export const db = getFirestore(app)