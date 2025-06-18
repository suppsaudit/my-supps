export interface UserProfileData {
  weight?: number | null;
  height?: number | null;
  age?: number | null;
  gender?: 'male' | 'female' | 'other' | null;
  adhd_tendency?: boolean;
  conditions?: string[];
  goals?: string[];
}