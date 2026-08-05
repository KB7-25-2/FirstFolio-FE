import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth'
import { firebaseAuth } from '@/lib/firebase.js'

const googleProvider = new GoogleAuthProvider()

export const signUpWithEmail = (email, password) =>
  createUserWithEmailAndPassword(firebaseAuth, email, password)

export const signInWithEmail = (email, password) =>
  signInWithEmailAndPassword(firebaseAuth, email, password)

export const signInWithGoogle = () => signInWithPopup(firebaseAuth, googleProvider)

export const getIdToken = async (forceRefresh = false) => {
  const user = firebaseAuth.currentUser
  if (!user) {
    throw new Error('Firebase 인증된 사용자가 없습니다.')
  }
  return user.getIdToken(forceRefresh)
}

export const signOutFirebase = () => signOut(firebaseAuth)

export const onFirebaseAuthStateChanged = (callback) => onAuthStateChanged(firebaseAuth, callback)

export const getCurrentFirebaseUser = () => firebaseAuth.currentUser
