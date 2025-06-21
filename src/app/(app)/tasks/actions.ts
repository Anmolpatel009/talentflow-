'use server';

import {revalidatePath} from 'next/cache';
import {z} from 'zod';

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

  // Here you would typically save the data to your database.
  // For this prototype, we'll just log it to the console.
  console.log('New task created:', validatedFields.data);

  // Revalidate the tasks page to show the new task if we were updating a list.
  revalidatePath('/tasks');

  return {
    message: `Task "${validatedFields.data.title}" posted successfully!`,
    success: true,
  };
}
