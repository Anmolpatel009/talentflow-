"use server";

import { z } from "zod";
import { redirect } from 'next/navigation'

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  roles: z.enum(["freelancer", "client"], {
    errorMap: () => ({ message: "Please select a role." }),
  }),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

type AuthState = {
  message?: string | null;
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    roles?: string[];
  } | null,
  success?: boolean;
} | null;

export async function signup(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors below.",
      success: false
    };
  }

  console.log("Signing up user:", validatedFields.data);
  // --- Placeholder for Firebase Auth ---
  // In a real app, you would:
  // 1. Use Firebase Admin SDK to create a user.
  //    const userRecord = await admin.auth().createUser({...});
  // 2. Create a user document in Firestore with roles, etc.
  //    await db.collection('users').doc(userRecord.uid).set({...});
  // 3. Handle potential errors (e.g., email already exists).

  return { success: true, message: "Signup successful!" };
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));
  
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid credentials.",
      success: false,
    }
  }

  console.log("Logging in user:", validatedFields.data);
  // --- Placeholder for Firebase Auth ---
  // In a real app, you would:
  // 1. On the client, use signInWithEmailAndPassword.
  // 2. Get the ID token from the result.
  // 3. Send the token to a server-side endpoint.
  // 4. On the server, verify the token and create a session cookie.
  // 5. Redirect the user.

  // For this prototype, we'll just simulate success and redirect.
  // The redirect will be handled on the client-side based on the success flag.
  return { success: true, message: "Login successful!" };
}
