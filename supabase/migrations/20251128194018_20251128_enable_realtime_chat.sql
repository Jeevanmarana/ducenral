/*
  # Enable Realtime for Chat Messages

  1. Changes
    - Enable realtime publication on chat_messages table
    - This allows real-time message delivery like Instagram Messenger
    - Users will see messages instantly as they're sent without page refresh
  
  2. How It Works
    - Supabase Realtime uses PostgreSQL's LISTEN/NOTIFY
    - When a new message is inserted, subscribed clients receive it instantly
    - Messages appear in chat rooms in real-time across all connected users
*/

BEGIN;

-- Enable realtime for chat_messages if not already enabled
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;

COMMIT;