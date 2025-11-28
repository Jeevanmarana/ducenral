import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Profile = {
  id: string;
  name: string;
  college_name: string;
  course: string;
  unique_trait: string;
  created_at: string;
  updated_at: string;
};

export type Subject = {
  id: string;
  name: string;
  category: 'BCP' | 'SEC' | 'GE' | 'VAC' | 'AEC';
  course: string;
  created_at: string;
};

export type Note = {
  id: string;
  title: string;
  content: string;
  subject_id: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
};

export type ChatRoom = {
  id: string;
  name: string;
  description: string;
  created_at: string;
};

export type ChatMessage = {
  id: string;
  room_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profiles?: Profile;
};
