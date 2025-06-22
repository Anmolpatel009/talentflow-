"use server";

import { z } from "zod";
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from "@/lib/session";
import { createUser, findUserByEmail } from "@/lib/users";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  location: z.string().min(2, "Please enter a location."),
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
    location?: string[];
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

  const { name, email, password, location, roles } = validatedFields.data;

  const existingUser = await findUserByEmail(email);
  if (existingUser) {
    return {
        message: "A user with this email already exists.",
        success: false,
    }
  }

  // A real app would have more complex skill acquisition. For now, mock it.
  const skills = roles === 'freelancer' ? ['New Skill', 'Ready to learn'] : [];

  const user = await createUser({
    name,
    email,
    password,
    location,
    role: roles,
    skills,
    skill: skills[0] || '',
  });

  await createSession({
    email: user.email,
    name: user.name,
    role: user.role,
    location: user.location,
  });

  return { success: true, message: "Signup successful!", role: user.role };
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

  const { email, password } = validatedFields.data;

  let user = await findUserByEmail(email);

  // For this demo, if the user doesn't exist on login, we create them
  // This maintains the simple "any email works" login experience from before.
  if (!user) {
    const role = email.toLowerCase().includes('client') ? 'client' : 'freelancer';
    const skills = role === 'freelancer' ? ['Web Development', 'React'] : [];
    user = await createUser({
        name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase()),
        email,
        password,
        location: 'New York, NY', // Default location for auto-created users
        role,
        skills,
        skill: skills[0] || '',
    });
  }

  // In a real app, you'd compare the hashed password. Here we just check for existence.
  
  await createSession({
    email: user.email,
    name: user.name,
    role: user.role,
    location: user.location,
  });

  return { success: true, message: "Login successful!", role: user.role };
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
