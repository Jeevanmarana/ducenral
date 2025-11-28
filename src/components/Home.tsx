import { useAuth } from '../contexts/AuthContext';
import { Users, BookOpen, MessageCircle, Sparkles } from 'lucide-react';

type HomeProps = {
  onTabChange: (tab: string) => void;
};

export function Home({ onTabChange }: HomeProps) {
  const { profile } = useAuth();

  const features = [
    {
      icon: Users,
      title: 'Connect with Students',
      description: 'Discover and connect with fellow students from University of Delhi',
      action: 'View Profiles',
      tab: 'profiles',
      color: 'bg-blue-500',
    },
    {
      icon: BookOpen,
      title: 'Study Materials',
      description: 'Access notes for BCP, SEC, GE, VAC, and AEC subjects',
      action: 'Browse Notes',
      tab: 'notes',
      color: 'bg-green-500',
    },
    {
      icon: MessageCircle,
      title: 'Group Chats',
      description: 'Join study groups and chat rooms for casual conversations',
      action: 'Join Chats',
      tab: 'chat',
      color: 'bg-purple-500',
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 mb-8 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Sparkles className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Welcome back, {profile?.name}!</h1>
        </div>
        <p className="text-blue-100 text-lg">
          {profile?.college_name} • {profile?.course}
        </p>
        {profile?.unique_trait && (
          <p className="mt-4 text-blue-50 italic">"{profile.unique_trait}"</p>
        )}
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <div
              key={feature.tab}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className={`${feature.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-gray-600 mb-4">{feature.description}</p>
              <button
                onClick={() => onTabChange(feature.tab)}
                className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-2"
              >
                <span>{feature.action}</span>
                <span>→</span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          About Campus Connect
        </h2>
        <div className="space-y-3 text-gray-600">
          <p>
            Campus Connect is your all-in-one platform for connecting with fellow students,
            accessing study materials, and joining engaging conversations.
          </p>
          <p>
            Built by students, for students at University of Delhi. Leave your mark and
            make the most of your campus life!
          </p>
        </div>
      </div>
    </div>
  );
}
