'use server';

import { revalidatePath } from 'next/cache';
import { applyToTask as applyToTaskInDb } from '@/lib/tasks';
import { getSession } from '@/lib/session';

type State = {
    success: boolean;
    message: string;
}

export async function applyForTask(prevState: State, formData: FormData): Promise<State> {
    const session = await getSession();

    if (!session || session.role !== 'freelancer') {
        return { success: false, message: "Only freelancers can apply for tasks." };
    }
    
    const taskId = formData.get('taskId') as string;
    if (!taskId) {
        return { success: false, message: "Task ID is missing." };
    }

    try {
        await applyToTaskInDb(taskId, session.uid, session.email);
        revalidatePath('/client-dashboard');
        revalidatePath(`/tasks/${taskId}`);
        revalidatePath(`/tasks/${taskId}/proposals`);
        revalidatePath('/freelancer-dashboard');
        revalidatePath('/tasks');
        return { success: true, message: "Successfully applied for the task!" };
    } catch (error: any) {
        console.error("Failed to apply for task:", error);
        
        if (error.message?.includes("PERMISSION_DENIED")) {
            return { success: false, message: "Permission denied. Please try again." };
        }
        if (error.message?.includes("already applied")) {
            return { success: false, message: error.message };
        }
        if (error.message?.includes("Task does not exist")) {
            return { success: false, message: "This task no longer exists." };
        }

        return { success: false, message: "An unexpected server error occurred while applying." };
    }
}
