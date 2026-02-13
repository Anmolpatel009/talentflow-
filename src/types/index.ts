// =====================================
// TALENTFLOW TYPE DEFINITIONS
// =====================================

// Role Types
export type UserRole = 'client' | 'freelancer' | null;
export type VerificationStatus = 'none' | 'pending' | 'verified';

// Task Types
export type TaskMode = 'immediate' | 'standard';
export type TaskStatus = 
  | 'open' 
  | 'assigned' 
  | 'in_progress' 
  | 'review' 
  | 'completed' 
  | 'disputed' 
  | 'cancelled';

export type TaskCategory = 
  | 'content_engine'
  | 'hyper_local_logistics'
  | 'tech_neighbor'
  | 'academic_support'
  | 'event_support'
  | 'ai_training'
  | 'digital_assistant';

export type MessageType = 'text' | 'image' | 'location' | 'otp';
export type OTPType = 'start' | 'end';
export type AlertType = 'general' | 'safety' | 'technical';

export type ApplicationStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn';

// =====================================
// DATABASE TABLES
// =====================================

export interface Profile {
  id: string;
  user_id: string;
  email: string;
  role: UserRole;
  full_name?: string | null;
  phone?: string | null;
  city?: string | null;
  verification_status: VerificationStatus;
  college_id_url?: string | null;
  gov_id_url?: string | null;
  aadhaar_last_four?: string | null;
  college_name?: string | null;
  skills: string[];
  commission_rate: number;
  location?: GeoLocation | null;
  last_location_update?: string | null;
  gear_list: string[];
  completed_tasks: number;
  average_rating: number;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: string;
  client_id: string;
  title: string;
  description: string;
  mode: TaskMode;
  category: TaskCategory;
  budget: number;
  escrow_amount?: number | null;
  geo_location?: GeoLocation | null;
  address_text?: string | null;
  is_nearby: boolean;
  status: TaskStatus;
  acceptance_deadline?: string | null;
  portfolio_required: boolean;
  revision_limit: number;
  created_at: string;
  updated_at: string;
  started_at?: string | null;
  completed_at?: string | null;
}

export interface TaskHandshake {
  id: string;
  task_id: string;
  freelancer_id: string;
  accepted_at: string;
  is_cancelled: boolean;
  cancelled_reason?: string | null;
}

export interface TaskApplication {
  id: string;
  task_id: string;
  freelancer_id: string;
  cover_letter: string;
  portfolio_links: string[];
  proposed_budget?: number | null;
  status: ApplicationStatus;
  created_at: string;
  updated_at: string;
}

export interface Chat {
  id: string;
  task_id: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  message_type: MessageType;
  safety_flagged: boolean;
  safety_filtered_content?: string | null;
  created_at: string;
}

export interface TaskAttachment {
  id: string;
  task_id: string;
  uploaded_by: string;
  file_url: string;
  file_type?: string | null;
  file_size?: number | null;
  is_proof_of_work: boolean;
  created_at: string;
}

export interface Review {
  id: string;
  task_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
}

export interface SOSAlert {
  id: string;
  task_id: string;
  user_id: string;
  user_location?: GeoLocation | null;
  alert_type: AlertType;
  status: 'pending' | 'acknowledged' | 'resolved';
  created_at: string;
  resolved_at?: string | null;
}

export interface OTP {
  id: string;
  task_id: string;
  otp: string;
  otp_type: OTPType;
  is_used: boolean;
  created_at: string;
  expires_at: string;
}

// =====================================
// GEOLOCATION TYPES
// =====================================

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface FuzzyLocation {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

// =====================================
// API RESPONSE TYPES
// =====================================

export interface NearbyTaskResult {
  id: string;
  title: string;
  budget: number;
  category: TaskCategory;
  mode: TaskMode;
  distance_meters: number;
}

export interface PaymentBreakdown {
  total: number;
  commissionRate: number;
  commissionAmount: number;
  freelancerAmount: number;
}

// =====================================
// AUTH TYPES
// =====================================

export interface User {
  id: string;
  email: string;
  email_confirmed_at?: string;
  created_at: string;
}

export interface Session {
  user: User;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}

// =====================================
// SIGNUP TYPES
// =====================================

export interface SignupData {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  city: string;
  role: 'client' | 'freelancer';
}

export interface FreelancerSignupData extends SignupData {
  role: 'freelancer';
  collegeName: string;
  collegeIdFile: File | null;
  govIdFile: File | null;
  skills: string[];
}

export interface ClientSignupData extends SignupData {
  role: 'client';
}

// =====================================
// UI STATE TYPES
// =====================================

export interface TaskFilters {
  mode?: TaskMode;
  category?: TaskCategory;
  maxDistance?: number;
  minBudget?: number;
  maxBudget?: number;
}

export interface ChatState {
  isOpen: boolean;
  activeChatId: string | null;
  unreadCount: number;
}

// =====================================
// CONSTANTS
// =====================================

export const TASK_CATEGORIES = [
  { value: 'content_engine', label: 'Content Engine', icon: '🎬' },
  { value: 'hyper_local_logistics', label: 'Hyper-Local Logistics', icon: '📦' },
  { value: 'tech_neighbor', label: 'Tech Neighbor', icon: '💻' },
  { value: 'academic_support', label: 'Academic Support', icon: '📚' },
  { value: 'event_support', label: 'Event Support', icon: '🎪' },
  { value: 'ai_training', label: 'AI Training', icon: '🎙️' },
  { value: 'digital_assistant', label: 'Digital Assistant', icon: '📊' },
] as const;

export const DEFAULT_SEARCH_RADIUS_METERS = 5000; // 5km
export const FUZZY_LOCATION_OFFSET_METERS = 200; // 200m random offset

export const COMMISSION_RATES = {
  unverified: 50,
  verified: 10,
} as const;

export const REVISION_LIMIT_DEFAULT = 2;
export const OTP_EXPIRY_MINUTES = 15;
export const TASK_ACCEPTANCE_TIMEOUT_MINUTES = 30;
