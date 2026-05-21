import { initializeApp } from 'firebase/app'
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth'
import { getFirestore, doc, setDoc } from 'firebase/firestore'

const app = initializeApp({
  apiKey: 'AIzaSyCaV64y5EgZH_wiy53Qe6tY9R0oVlc_7xY',
  authDomain: 'salon-booking-2026-fb245.firebaseapp.com',
  projectId: 'salon-booking-2026-fb245',
})

const auth = getAuth(app)
const db = getFirestore(app)

async function createAdmin() {
  const owner = await createUserWithEmailAndPassword(auth, 'owner@salon.cz', 'admin123')
  await setDoc(doc(db, 'admins', owner.user.uid), {
    uid: owner.user.uid,
    email: 'owner@salon.cz',
    name: 'Majitelka',
    role: 'owner',
  })
  console.log('✅ Owner: owner@salon.cz / admin123')

  const recep = await createUserWithEmailAndPassword(auth, 'recepce@salon.cz', 'recep123')
  await setDoc(doc(db, 'admins', recep.user.uid), {
    uid: recep.user.uid,
    email: 'recepce@salon.cz',
    name: 'Recepce',
    role: 'receptionist',
  })
  console.log('✅ Receptionist: recepce@salon.cz / recep123')

  console.log('🎉 Done!')
  process.exit(0)
}

createAdmin().catch(console.error)