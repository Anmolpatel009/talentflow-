
"use server";

import { z } from "zod";
import { redirect } from 'next/navigation'
import { createSession, deleteSession } from "@/lib/session";
import connectToDatabase from "@/lib/mongoose";
import User from "@/models/User";

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
  await connectToDatabase(); // Ensure connection is established

  const validatedFields = signupSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Please correct the errors below.",
      success: false
    };
  }

  const { name, email, password, location, roles } = validatedFields.data;

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return {
        message: "A user with this email already exists.",
        success: false,
    }
  }
  
  // In a real app, hash the password before storing it
  const passwordHash = `hashed_${password}`; // Replace with actual secure hashing
  
  // A real app would have more complex skill acquisition. For now, mock it.
  const skills = roles === 'freelancer' ? ['New Skill', 'Ready to learn'] : [];
  const primarySkill = skills[0] || ''; // Assuming the first skill is the primary
  
  try {
    const newUser = new User({
    name,
    email,
    passwordHash,
    password,
    location,
    role: roles,
    skills,
    skill: skills[0] || '',
  });

    const user = await newUser.save(); // Save the new user to MongoDB

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
      // Handle specific Mongoose validation or duplicate errors if needed
      if (error.code === 11000) { // Duplicate key error
          return { errors: { email: ['Email already exists.'] }, message: "A user with this email already exists.", success: false };
      }
      return { errors: { _form: ['An error occurred during signup.'] }, message: "An error occurred during signup.", success: false };
  }

}

export async function login(prevState: AuthState, formData: FormData): Promise<AuthState> {
  await connectToDatabase(); // Ensure connection is established

  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: "Invalid credentials.",
      success: false,
    };
  }

  const { email, password } = validatedFields.data;

  const user = await User.findOne({ email });

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
}

export async function logout() {
  await deleteSession();
  redirect("/login");
}
