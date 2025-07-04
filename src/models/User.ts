import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'freelancer' | 'client';
  location: string;
  skills: string[];
  skill: string;
  avatar: string;
  hint: string;
  distance: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, enum: ['freelancer', 'client'] },
  location: { type: String, required: true },
  skills: { type: [String], required: true },
  skill: { type: String, required: true },
  avatar: { type: String, required: true },
  hint: { type: String, required: true },
  distance: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const User = mongoose.model<IUser>('User', UserSchema);

export default User;