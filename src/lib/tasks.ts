// This file manages tasks using Firestore.
import "server-only";
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';

export type Task = {
  id: string;
  clientId: string; // Corresponds to user's email for this prototype
  title: string;
  description: string;
  category: string;
  budget: number;
  proposals: number;
};

const tasksCollection = collection(db, 'tasks');

/**
 * Retrieves all tasks posted by a specific client from Firestore.
 * @param clientId The email of the client whose tasks to fetch.
 * @returns A promise that resolves to an array of tasks.
 */
export async function getTasksForClient(clientId: string): Promise<Task[]> {
  // In a real app, you might want to add error handling for the database query.
  const q = query(tasksCollection, where("clientId", "==", clientId));
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return [];
  }

  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Task[];
}

/**
 * Creates a new task for a client in Firestore.
 * @param taskData The data for the new task, excluding id and proposal count.
 * @returns A promise that resolves to the newly created task.
 */
export async function createTaskForClient(
  taskData: Omit<Task, "id" | "proposals">
): Promise<Task> {
  const newTaskPayload = {
    ...taskData,
    proposals: 0, // New tasks always start with 0 proposals
  };

  const docRef = await addDoc(tasksCollection, newTaskPayload);
  
  return {
    ...newTaskPayload,
    id: docRef.id,
  };
}
