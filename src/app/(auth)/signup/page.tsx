
"use client";

import { useActionState, useEffect } from "react";
import { useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { signup } from "@/app/(auth)/actions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" className="w-full" disabled={pending}>
      {pending ? <Loader2 className="animate-spin" /> : "Create Account"}
    </Button>
  );
}

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [state, formAction] = useActionState(signup, null);

  useEffect(() => {
    if (state?.success && state.role) {
      toast({
        title: "Welcome!",
        description: "Your account has been created successfully.",
      });
      const dashboardUrl = state.role === 'client' ? '/client-dashboard' : '/freelancer-dashboard';
      router.push(dashboardUrl);
    } else if (state?.message && !state.success) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
  }, [state, router, toast]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Create an Account</CardTitle>
        <CardDescription>Join Localance to find work or hire talent locally.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
           <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input id="name" name="name" placeholder="John Doe" required />
            {state?.errors?.name && <p className="text-sm text-destructive">{state.errors.name.join(", ")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" placeholder="name@example.com" required />
            {state?.errors?.email && <p className="text-sm text-destructive">{state.errors.email.join(", ")}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            {state?.errors?.password && <p className="text-sm text-destructive">{state.errors.password.join(", ")}</p>}
          </div>
           <div className="space-y-2">
            <Label htmlFor="location">Your Location</Label>
            <Input id="location" name="location" placeholder="e.g., San Francisco, CA" required />
             {state?.errors?.location && <p className="text-sm text-destructive">{state.errors.location.join(", ")}</p>}
          </div>
          <div className="space-y-3">
             <Label>How will you use Localance?</Label>
              {state?.errors?.roles && <p className="text-sm text-destructive">{state.errors.roles.join(", ")}</p>}
             <RadioGroup name="roles" defaultValue="freelancer" className="grid grid-cols-2 gap-4">
                <div>
                    <RadioGroupItem value="freelancer" id="freelancer" className="peer sr-only" />
                    <Label htmlFor="freelancer" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                       I'm a freelancer, looking for work
                    </Label>
                </div>
                <div>
                    <RadioGroupItem value="client" id="client" className="peer sr-only" />
                    <Label htmlFor="client" className="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary">
                        I'm a client, looking to hire
                    </Label>
                </div>
             </RadioGroup>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <SubmitButton />
          <p className="text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
