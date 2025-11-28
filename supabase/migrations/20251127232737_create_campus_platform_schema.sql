/*
  # Campus Connect Platform - Database Schema

  ## Overview
  Creates the complete database structure for a student campus platform with profiles, notes, and chat functionality.

  ## New Tables
  
  ### 1. `profiles`
  Student profiles with basic information
  - `id` (uuid, primary key) - Links to auth.users
  - `name` (text) - Student's full name
  - `college_name` (text) - College/Department name
  - `course` (text) - Course enrolled in
  - `unique_trait` (text) - Something unique about the student
  - `created_at` (timestamptz) - Profile creation timestamp
  - `updated_at` (timestamptz) - Last update timestamp

  ### 2. `subjects`
  Available subjects in the curriculum
  - `id` (uuid, primary key)
  - `name` (text) - Subject name
  - `category` (text) - BCP, SEC, GE, VAC, or AEC
  - `course` (text) - Related course
  - `created_at` (timestamptz)

  ### 3. `notes`
  Study materials and notes
  - `id` (uuid, primary key)
  - `title` (text) - Note title
  - `content` (text) - Note content
  - `subject_id` (uuid) - Related subject
  - `uploaded_by` (uuid) - User who uploaded
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)

  ### 4. `chat_rooms`
  Group chat rooms
  - `id` (uuid, primary key)
  - `name` (text) - Room name
  - `description` (text) - Room description
  - `created_at` (timestamptz)

  ### 5. `chat_messages`
  Messages in chat rooms
  - `id` (uuid, primary key)
  - `room_id` (uuid) - Related chat room
  - `user_id` (uuid) - Message sender
  - `message` (text) - Message content
  - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Policies for authenticated users to manage their own data
  - Read access for all authenticated users
  - Proper foreign key constraints

  ## Initial Data
  - 5 default chat rooms for student discussions
  - Common subject categories pre-populated
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  college_name text NOT NULL,
  course text NOT NULL,
  unique_trait text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE
  TO authenticated
  USING (auth.uid() = id);

-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL CHECK (category IN ('BCP', 'SEC', 'GE', 'VAC', 'AEC')),
  course text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view subjects"
  ON subjects FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add subjects"
  ON subjects FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  subject_id uuid REFERENCES subjects(id) ON DELETE CASCADE,
  uploaded_by uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view notes"
  ON notes FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can create notes"
  ON notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can update own notes"
  ON notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = uploaded_by)
  WITH CHECK (auth.uid() = uploaded_by);

CREATE POLICY "Users can delete own notes"
  ON notes FOR DELETE
  TO authenticated
  USING (auth.uid() = uploaded_by);

-- Create chat_rooms table
CREATE TABLE IF NOT EXISTS chat_rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view chat rooms"
  ON chat_rooms FOR SELECT
  TO authenticated
  USING (true);

-- Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid REFERENCES chat_rooms(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view messages"
  ON chat_messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Users can send messages"
  ON chat_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
  ON chat_messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Insert default chat rooms
INSERT INTO chat_rooms (name, description) VALUES
  ('General Discussion', 'Chat about anything and everything'),
  ('Study Group', 'Discuss assignments, exams, and study tips'),
  ('Campus Events', 'Share and discuss campus events and activities'),
  ('Tech Talk', 'Technology, coding, and career discussions'),
  ('Chill Zone', 'Casual conversations and making friends')
ON CONFLICT DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notes_subject ON notes(subject_id);
CREATE INDEX IF NOT EXISTS idx_notes_uploaded_by ON notes(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_chat_messages_room ON chat_messages(room_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();