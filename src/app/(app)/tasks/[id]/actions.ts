'use server';

import { revalidatePath } from 'next/cache';
import { applyToTask as applyToTaskInDb } from '@/lib/tasks';
import { getSession } from '@/lib/session';

export async function applyForTask(taskId: string): Promise<{ success: boolean; message: string }> {
    const session = await getSession();

    if (!session || session.role !== 'freelancer') {
        return { success: false, message: "Only freelancers can apply for tasks." };
    }

    try {
        await applyToTaskInDb(taskId);
        revalidatePath('/client-dashboard');
        revalidatePath(`/tasks/${taskId}`);
        revalidatePath('/freelancer-dashboard');
        revalidatePath('/tasks');
        return { success: true, message: "Successfully applied for the task!" };
    } catch (error) {
        console.error("Failed to apply for task:", error);
        return { success: false, message: "There was an error applying for the task." };
    }
}
