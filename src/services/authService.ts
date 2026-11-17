import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Unsubscribe,
  type User,
  type UserCredential,
} from 'firebase/auth';
import type { Credentials } from '../types';
import { auth, googleProvider } from './firebase';

export function registerWithEmail({ email, password }: Credentials): Promise<UserCredential> {
  return createUserWithEmailAndPassword(auth, email, password);
}

export function loginWithEmail({ email, password }: Credentials): Promise<UserCredential> {
  return signInWithEmailAndPassword(auth, email, password);
}

export function loginWithGoogleProvider(): Promise<UserCredential> {
  return signInWithPopup(auth, googleProvider);
}

export function logoutUser(): Promise<void> {
  return signOut(auth);
}

export function subscribeToAuthChanges(callback: (user: User | null) => void): Unsubscribe {
  return onAuthStateChanged(auth, callback);
}
