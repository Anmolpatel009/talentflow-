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
  role?: 'freelancer' | 'client';
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

  const { name, email, roles } = validatedFields.data;

  await createSession({
    email,
    name,
    role: roles,
  });

  return { success: true, message: "Signup successful!", role: roles };
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

  const email = validatedFields.data.email;
  const name = email.split('@')[0]
    .split('.')
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
  
  // Mock role detection for login. In a real app, you'd fetch this from your DB.
  const role = email.toLowerCase().includes('client') ? 'client' : 'freelancer';

  await createSession({
    email,
    name,
    role,
  });

  return { success: true, message: "Login successful!", role };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
