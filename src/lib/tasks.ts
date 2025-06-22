// This file simulates a database for managing tasks.
// In a production application, you would replace this with a real database like MongoDB, PostgreSQL, or Firestore.
import "server-only";

export type Task = {
  id: string;
  clientId: string; // Corresponds to user's email for this prototype
  title: string;
  description: string;
  category: string;
  budget: number;
  proposals: number;
};

// We'll use a simple in-memory array to store our tasks.
// This will reset every time the server restarts.
const tasks: Task[] = [
  {
    id: "1",
    clientId: "client@example.com",
    title: "Design a new logo for my coffee shop",
    description: "Looking for a creative designer to create a modern and friendly logo for a new coffee shop brand. The logo should be versatile for use on cups, signs, and social media.",
    category: "Design",
    budget: 300,
    proposals: 3,
  },
   {
    id: "2",
    clientId: "anotherclient@example.com",
    title: "Build a simple landing page with React",
    description: "Need a developer to build a responsive one-page landing site using React and Next.js. The design is ready in Figma. Must be pixel-perfect.",
    category: "Web Development",
    budget: 800,
    proposals: 5,
  },
];

/**
 * Retrieves all tasks posted by a specific client.
 * @param clientId The email of the client whose tasks to fetch.
 * @returns A promise that resolves to an array of tasks.
 */
export async function getTasksForClient(clientId: string): Promise<Task[]> {
  // In a real app, this would be a database query:
  // e.g., db.collection('tasks').where('clientId', '==', clientId).get()
  return tasks.filter((task) => task.clientId === clientId);
}

/**
 * Creates a new task for a client.
 * @param taskData The data for the new task, excluding id and proposal count.
 * @returns A promise that resolves to the newly created task.
 */
export async function createTaskForClient(
  taskData: Omit<Task, "id" | "proposals">
): Promise<Task> {
  const newId = (tasks.length + 1).toString();
  const newTask: Task = {
    ...taskData,
    id: newId,
    proposals: 0, // New tasks always start with 0 proposals
  };

  // In a real app, this would be a database insert:
  // e.g., db.collection('tasks').add(newTask)
  tasks.push(newTask);
  console.log("New task created and added to the store:", newTask);
  return newTask;
}
