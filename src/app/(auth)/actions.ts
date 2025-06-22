"use server";

import { z } from "zod";
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from "@/lib/session";

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

  // --- Placeholder for Authentication Logic ---
  // Here, you would verify the user's password against a stored hash.
  // For this prototype, we assume the login is always successful.

  const email = validatedFields.data.email;
  // Mock user name from email for display purposes
  const name = email.split('@')[0]
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  await createSession({
    email,
    name,
  });

  return { success: true, message: "Login successful!" };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
