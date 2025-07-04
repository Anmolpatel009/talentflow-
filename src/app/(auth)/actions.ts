
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
    _form?: string[];
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

  try {
    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return {
          message: "A user with this email already exists.",
          success: false,
      }
    }
    
    // A real app would have more complex skill acquisition. For now, mock it.
    const skills = roles === 'freelancer' ? ['New Skill', 'Ready to learn'] : [];
    const primarySkill = skills[0] || '';

    // Mock coordinates around a central point (e.g., San Francisco) for demonstration
    const baseLat = 37.7749;
    const baseLng = -122.4194;
    const latitude = baseLat + (Math.random() - 0.5) * 0.2; // Approx +/- 11 km
    const longitude = baseLng + (Math.random() - 0.5) * 0.2;
    
    const user = await createUser({
      name,
      email,
      password,
      location,
      role: roles,
      skills,
      skill: primarySkill,
      latitude,
      longitude,
    });

    await createSession({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      location: user.location,
    });
      
    return { success: true, message: "Signup successful!", role: user.role };
  } catch (error: any) {
    console.error('Error creating user:', error);
    if (error.code?.includes('permission-denied')) {
        return { message: "Database permission denied. Please check your Firestore security rules.", success: false };
    }
    return { message: 'An unexpected server error occurred during signup.', success: false };
  }
}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid credentials.",
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  try {
    const user = await findUserByEmail(email);

    // In a production app, you would compare hashed passwords.
    // For this prototype, we'll do a simple string comparison.
    // The stored "hash" is just `hashed_${password}`.
    if (!user || user.passwordHash !== `hashed_${password}`) {
      return {
        message: 'Invalid email or password.',
        success: false,
      };
    }

    await createSession({
      uid: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      location: user.location,
    });

    return { success: true, message: "Login successful!", role: user.role };
  } catch(error: any) {
    console.error('Login error:', error);
    if (error.code?.includes('permission-denied')) {
        return { message: "Database permission denied. Please check your Firestore security rules.", success: false };
    }
    return { message: 'An unexpected server error occurred during login.', success: false };
  }
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
