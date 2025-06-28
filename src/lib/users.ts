// src/lib/users.ts
import 'server-only';
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, doc, getDoc, getCountFromServer } from 'firebase/firestore';

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // In a real app, use Firebase Auth instead of storing hashes
  role: 'freelancer' | 'client';
  location: string;
  skills: string[];
  skill: string; // Primary skill
  avatar: string;
  hint: string;
  distance: string; // Mock distance for display
};

const usersCollection = collection(db, 'users');

export async function findUserByEmail(email: string): Promise<User | undefined> {
  const q = query(usersCollection, where("email", "==", email.toLowerCase()));
  const querySnapshot = await getDocs(q);
  
  if (querySnapshot.empty) {
    return undefined;
  }
  
  const userDoc = querySnapshot.docs[0];
  return { id: userDoc.id, ...userDoc.data() } as User;
}

export async function createUser(data: Omit<User, 'id' | 'passwordHash' | 'avatar' | 'hint' | 'distance'> & { password?: string }): Promise<User> {
  const newUserPayload = {
    ...data,
    email: data.email.toLowerCase(),
    // This is not secure. In a real app, use Firebase Authentication.
    passwordHash: `hashed_${data.password}`,
    avatar: 'https://placehold.co/100x100.png',
    hint: 'person portrait',
    distance: `${(Math.random() * 5).toFixed(1)} km`, // Mock distance
  };
  // The password should not be stored in the document.
  delete (newUserPayload as any).password;

  const docRef = await addDoc(usersCollection, newUserPayload);

  return {
    ...newUserPayload,
    id: docRef.id,
  };
}

export async function getFreelancers(): Promise<User[]> {
  const q = query(usersCollection, where("role", "==", "freelancer"));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
      return [];
  }

  return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
  })) as User[];
}

export async function getFreelancerCount(): Promise<number> {
    const q = query(usersCollection, where("role", "==", "freelancer"));
    const snapshot = await getCountFromServer(q);
    return snapshot.data().count;
}
