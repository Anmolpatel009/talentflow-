// src/lib/users.ts
import 'server-only';

// This file simulates a user database.
// In a production application, you would replace this with a real database like MongoDB or Firestore.

export type User = {
  id: string;
  name: string;
  email: string;
  passwordHash: string; // In a real app, never store plain text passwords
  role: 'freelancer' | 'client';
  location: string;
  skills: string[];
  skill: string; // Primary skill
  avatar: string;
  hint: string;
  distance: string; // Mock distance for display
};

// In-memory array to store users, simulating a database table.
const users: User[] = [
    {
        id: '1',
        name: 'Aria Montgomery',
        email: 'aria@example.com',
        passwordHash: 'hashedpassword',
        role: 'freelancer',
        location: 'San Francisco, CA',
        skills: ['Figma', 'UI/UX', 'Web Design', 'Mobile Apps'],
        skill: 'Lead UI/UX Designer',
        avatar: 'https://placehold.co/100x100.png',
        hint: 'woman portrait',
        distance: '1.5 km',
    },
    {
        id: '2',
        name: 'Ken Adams',
        email: 'ken@example.com',
        passwordHash: 'hashedpassword',
        role: 'freelancer',
        location: 'San Francisco, CA',
        skills: ['Go', 'Docker', 'Kubernetes', 'gRPC'],
        skill: 'Senior Go Developer',
        avatar: 'https://placehold.co/100x100.png',
        hint: 'man portrait',
        distance: '0.8 km'
    },
];

let nextId = users.length + 1;

export async function findUserByEmail(email: string): Promise<User | undefined> {
  return users.find((user) => user.email.toLowerCase() === email.toLowerCase());
}

export async function createUser(data: Omit<User, 'id' | 'passwordHash' | 'avatar' | 'hint' | 'distance'> & { password?: string }): Promise<User> {
  const newUser: User = {
    ...data,
    id: (nextId++).toString(),
    passwordHash: `hashed_${data.password}`, // Simple mock hashing
    avatar: 'https://placehold.co/100x100.png',
    hint: 'person portrait',
    distance: `${(Math.random() * 5).toFixed(1)} km`, // Mock distance
    skill: data.skills[0] || 'Specialist',
  };
  users.push(newUser);
  console.log('Current users:', users);
  return newUser;
}

export async function getFreelancers(): Promise<User[]> {
  return users.filter((user) => user.role === 'freelancer');
}
