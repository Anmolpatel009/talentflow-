// This file manages tasks using Firestore.
import "server-only";
import { db } from './firebase';
import { collection, query, where, getDocs, addDoc, getDoc, doc, updateDoc, increment, runTransaction } from 'firebase/firestore';
import type { User } from './users';

export type Task = {
  id: string;
  clientId: string; // Corresponds to user's email for this prototype
  clientUid: string; // Corresponds to user's document ID in Firestore
  title: string;
  description: string;
  category: string;
  budget: number;
  proposals: number;
};

export type TaskWithUser = Task & {
  clientName?: string;
}

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
 * Retrieves all tasks from Firestore and includes the client's name.
 * @returns A promise that resolves to an array of all tasks with client info.
 */
export async function getAllTasks(): Promise<TaskWithUser[]> {
  const q = query(tasksCollection);
  const querySnapshot = await getDocs(q);

  if (querySnapshot.empty) {
    return [];
  }

  const tasks = await Promise.all(
    querySnapshot.docs.map(async (taskDoc) => {
      const taskData = taskDoc.data() as Omit<Task, 'id'>;
      
      // Fetch the user data for the client who posted the task
      // This is inefficient (N+1 problem) but acceptable for a prototype.
      // In a real app, you might denormalize the client's name onto the task document.
      const userQuery = query(collection(db, 'users'), where("email", "==", taskData.clientId));
      const userSnapshot = await getDocs(userQuery);
      
      let clientName = 'Unknown Client';
      if (!userSnapshot.empty) {
          const clientData = userSnapshot.docs[0].data() as User;
          clientName = clientData.name;
      }

      return {
        id: taskDoc.id,
        ...taskData,
        clientName: clientName,
      };
    })
  );

  return tasks;
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

/**
 * Retrieves a single task by its ID from Firestore.
 * @param id The ID of the task to fetch.
 * @returns A promise that resolves to the task data or null if not found.
 */
export async function getTaskById(id: string): Promise<TaskWithUser | null> {
  const taskDocRef = doc(db, 'tasks', id);
  const taskDoc = await getDoc(taskDocRef);

  if (!taskDoc.exists()) {
    return null;
  }

  const taskData = taskDoc.data() as Omit<Task, 'id'>;

  const userQuery = query(collection(db, 'users'), where("email", "==", taskData.clientId));
  const userSnapshot = await getDocs(userQuery);
  
  let clientName = 'Unknown Client';
  if (!userSnapshot.empty) {
      const clientData = userSnapshot.docs[0].data() as User;
      clientName = clientData.name;
  }

  return {
    id: taskDoc.id,
    ...taskData,
    clientName,
  };
}

/**
 * Records a freelancer's application for a specific task.
 * @param taskId The ID of the task to update.
 * @param freelancerUid The unique ID of the applying freelancer.
 * @param freelancerEmail The email of the applying freelancer.
 */
export async function applyToTask(taskId: string, freelancerUid: string, freelancerEmail: string) {
    const taskDocRef = doc(db, 'tasks', taskId);
    const proposalCollectionRef = collection(taskDocRef, 'proposals');
    const proposalDocRef = doc(proposalCollectionRef, freelancerUid); // Use freelancerUid as doc ID to prevent duplicates

    // Use a transaction to ensure atomicity
    await runTransaction(db, async (transaction) => {
        const taskDoc = await transaction.get(taskDocRef);
        if (!taskDoc.exists()) {
            throw new Error("Task does not exist!");
        }

        const proposalDoc = await transaction.get(proposalDocRef);
        if (proposalDoc.exists()) {
            throw new Error("You have already applied for this task.");
        }

        // Add the proposal document
        transaction.set(proposalDocRef, {
            freelancerUid: freelancerUid,
            freelancerEmail: freelancerEmail,
            appliedAt: new Date(),
        });

        // Increment the proposal count on the main task document
        transaction.update(taskDocRef, {
            proposals: increment(1)
        });
    });
}

/**
 * Retrieves all freelancers who have applied for a task.
 * @param taskId The ID of the task.
 * @returns A promise that resolves to an array of User objects for each applicant.
 */
export async function getProposalsForTask(taskId: string): Promise<User[]> {
    const proposalsCollectionRef = collection(db, 'tasks', taskId, 'proposals');
    const proposalsSnapshot = await getDocs(proposalsCollectionRef);

    if (proposalsSnapshot.empty) {
        return [];
    }

    const freelancerEmails = proposalsSnapshot.docs.map(doc => doc.data().freelancerEmail as string);
    
    if (freelancerEmails.length === 0) {
        return [];
    }

    // This can be inefficient for many proposals. Firestore recommends limiting 'in' queries to 10-30 items.
    // For a production app with many proposals, a different data model or cloud functions might be better.
    const usersQuery = query(collection(db, 'users'), where('email', 'in', freelancerEmails));
    const usersSnapshot = await getDocs(usersQuery);

    return usersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
    })) as User[];
}
