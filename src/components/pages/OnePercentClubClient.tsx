
"use client";

import { createAssessment } from "@/app/(app)/one-percent-club/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BrainCircuit, Loader2 } from "lucide-react";
import { useActionState } from "react";
import { useFormStatus } from "react-dom";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        "Generate Test"
      )}
    </Button>
  );
}

export function OnePercentClubClient() {
  const initialState = { message: null, test: null, error: false };
  const [state, dispatch] = useActionState(createAssessment, initialState);

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
          <BrainCircuit className="w-6 h-6" />
          AI Skill Assessment
        </CardTitle>
        <CardDescription>
          Enter a skill to generate a custom assessment test and prove your expertise.
        </CardDescription>
      </CardHeader>
      <form action={dispatch} className="flex flex-col flex-grow">
        <CardContent className="space-y-4 flex-grow">
          <div className="space-y-2">
            <Label htmlFor="skill">Skill Name</Label>
            <Input
              id="skill"
              name="skill"
              placeholder="e.g., 'React', 'Go', 'UI/UX Design'"
              required
            />
          </div>
          {state?.error && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}

          {state?.test && (
            <div className="space-y-2 pt-4">
                <Label>Generated Assessment</Label>
                <ScrollArea className="h-72 w-full rounded-md border p-4 bg-muted/50">
                    <pre className="text-sm whitespace-pre-wrap font-body">{state.test}</pre>
                </ScrollArea>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <SubmitButton />
        </CardFooter>
      </form>
    </Card>
  );
}
