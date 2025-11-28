# Campus Connect - University of Delhi Student Platform

A comprehensive student platform for University of Delhi students to connect, share knowledge, and engage in meaningful conversations.

## Features

### 1. Student Profiles
- Create your profile with name, college, course, and unique traits
- Browse and discover fellow students across different colleges
- Search by name, college, or course
- View unique traits that make each student special

### 2. Study Materials
- Access notes organized by subject categories:
  - **BCP** (Basic Core Paper) - Core course subjects
  - **SEC** (Skill Enhancement Course) - Specialized skills
  - **GE** (Generic Elective) - General subjects
  - **VAC** (Value Added Course) - Holistic development
  - **AEC** (Ability Enhancement Course) - Fundamental abilities
- Add your own notes and contribute to the knowledge base
- Filter by category and search by subject or title
- See who uploaded each note

### 3. Group Chat Rooms
- **5 Pre-configured Chat Rooms:**
  1. General Discussion - Chat about anything
  2. Study Group - Discuss assignments and exams
  3. Campus Events - Share campus activities
  4. Tech Talk - Technology and career discussions
  5. Chill Zone - Casual conversations
- Real-time messaging with instant updates
- See who sent each message
- Mobile-friendly interface

## Getting Started

### First Time Users
1. **Sign Up**: Create an account with your email and password
2. **Create Profile**: Fill in your details (name, college, course, unique trait)
3. **Explore**: Start browsing profiles, notes, and join chat rooms!

### Navigation
The platform has a clean, Instagram-inspired interface with four main sections:
- **Home**: Dashboard with quick access to all features
- **Profiles**: Browse student profiles
- **Notes**: Access study materials
- **Chat**: Join group conversations

## Technical Stack
- **Frontend**: React + TypeScript + Tailwind CSS
- **Backend**: Supabase (PostgreSQL database)
- **Real-time**: Supabase real-time subscriptions
- **Authentication**: Supabase Auth

## Database Structure
- **profiles**: Student information
- **subjects**: Course subjects with categories
- **notes**: Study materials linked to subjects
- **chat_rooms**: Group chat rooms
- **chat_messages**: Real-time messages

## Security
- Row Level Security (RLS) enabled on all tables
- Users can only modify their own content
- All data requires authentication
- Secure password handling with Supabase Auth

## Future Enhancements
- Profile pictures
- Private messaging
- Events calendar
- Resource uploads (PDFs, documents)
- Notifications
- Advanced search and filters
- User badges and achievements

---

Built with ❤️ by University of Delhi students for students. Leave your mark on campus history!
