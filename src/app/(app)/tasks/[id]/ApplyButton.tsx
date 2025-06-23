"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import { applyForTask } from "./actions";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending} size="lg">
            {pending ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...
                </>
            ) : (
                <>
                    <Send className="mr-2 h-4 w-4" /> Apply Now
                </>
            )}
        </Button>
    )
}

export function ApplyButton({ taskId }: { taskId: string }) {
    const { toast } = useToast();
    const initialState = { success: false, message: "" };
    const [state, formAction] = useActionState(applyForTask, initialState);
    
    useEffect(() => {
        if (state.message) {
            if (state.success) {
                toast({
                    title: "Success!",
                    description: state.message,
                });
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: state.message,
                });
            }
        }
    }, [state, toast]);

    return (
        <form action={formAction}>
            <input type="hidden" name="taskId" value={taskId} />
            <SubmitButton />
        </form>
    );
}
