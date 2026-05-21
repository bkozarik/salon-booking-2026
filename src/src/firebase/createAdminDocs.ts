import { initializeApp } from 'firebase/app'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'AIzaSyCaV64y5EgZH_wiy53Qe6tY9R0oVlc_7xY',
  projectId: 'salon-booking-2026-fb245',
})

const db = getFirestore(app)

async function run() {
  await setDoc(doc(db, 'admins', '6oLwiCFqWBUOHE0c2cwJTq9ysgf2'), {
    uid: '6oLwiCFqWBUOHE0c2cwJTq9ysgf2',
    email: 'owner@salon.cz',
    name: 'Majitelka',
    role: 'owner',
  })
  console.log('✅ Owner doc created')

  await setDoc(doc(db, 'admins', 'kgzLGoOtLoWcIYGXPJflEkJAzGe2'), {
    uid: 'kgzLGoOtLoWcIYGXPJflEkJAzGe2',
    email: 'recepce@salon.cz',
    name: 'Recepce',
    role: 'receptionist',
  })
  console.log('✅ Receptionist doc created')

  console.log('🎉 Done!')
  process.exit(0)
}

run().catch(console.error)