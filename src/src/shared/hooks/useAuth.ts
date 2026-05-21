import { useState, useEffect } from 'react'
import { auth } from '../../firebase/config'
import { signInWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth'
import { db } from '../../firebase/config'
import { doc, getDoc } from 'firebase/firestore'

export interface AdminUser {
  uid: string
  email: string
  name: string
  role: 'owner' | 'receptionist'
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [adminData, setAdminData] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser)
      if (firebaseUser) {
        const snap = await getDoc(doc(db, 'admins', firebaseUser.uid))
        if (snap.exists()) {
          setAdminData(snap.data() as AdminUser)
        }
      } else {
        setAdminData(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = async (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password)
  }

  const logout = async () => {
    return signOut(auth)
  }

  return { user, adminData, loading, login, logout }
}