import mongoose, { Document, Schema } from 'mongoose';

interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  role: 'freelancer' | 'client';
  location: string;
  latitude: number;
  longitude: number;
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
  latitude: { type: Number, required: true },
  longitude: { type: Number, required: true },
  skills: { type: [String], required: true },
  skill: { type: String, required: true },
  avatar: { type: String, required: true, default: 'https://placehold.co/100x100.png' },
  hint: { type: String, required: true, default: 'person portrait' },
  distance: { type: String, required: true, default: '0 km' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isNew) {
    this.distance = `${(Math.random() * 5).toFixed(1)} km`;
  }
  next();
});

const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);

export default User;
