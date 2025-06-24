'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';
import { getSession } from '@/lib/session';
import { createTaskForClient } from '@/lib/tasks';

const taskSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters long.')
    .max(100, 'Title is too long.'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters long.')
    .max(500, 'Description is too long.'),
  category: z.string().min(1, 'Please select a category.'),
  budget: z.coerce.number().min(5, 'Budget must be at least $5.'),
});

type State = {
  message?: string | null;
  errors?: {
    title?: string[];
    description?: string[];
    category?: string[];
    budget?: string[];
  } | null;
  success?: boolean;
};

export async function createTask(
  prevState: State,
  formData: FormData
): Promise<State> {
  const validatedFields = taskSchema.safeParse({
    title: formData.get('title'),
    description: formData.get('description'),
    category: formData.get('category'),
    budget: formData.get('budget'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Please correct the errors below.',
      success: false,
    };
  }

  const session = await getSession();
  if (!session?.uid || !session?.email) {
    return {
      message: 'You must be logged in to post a task.',
      success: false,
    }
  }

  try {
    await createTaskForClient({
      clientId: session.email,
      clientUid: session.uid,
      title: validatedFields.data.title,
      description: validatedFields.data.description,
      category: validatedFields.data.category,
      budget: validatedFields.data.budget,
    });
  
    // Revalidate the client dashboard to show the new task.
    revalidatePath('/client-dashboard');
  
    return {
      message: `Task "${validatedFields.data.title}" posted successfully!`,
      success: true,
    };
  } catch(error) {
     return {
      message: 'There was an issue posting your task. Please try again.',
      success: false,
    };
  }
}
