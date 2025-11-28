/*
  # Fix Chat Messages Relationships

  ## Changes
  - Add direct foreign key from chat_messages.user_id to profiles.id
  - This allows proper joining and querying related profile data
  - Ensures data consistency between users and their messages

  ## Important Notes
  1. Profiles are created automatically when users sign up
  2. This relationship ensures we can fetch sender information with messages
  3. RLS policies remain in place for security
*/

ALTER TABLE chat_messages
ADD CONSTRAINT chat_messages_user_id_fkey_profiles
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;