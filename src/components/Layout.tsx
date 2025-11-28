import { ReactNode } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Home, Users, BookOpen, MessageCircle, LogOut, User } from 'lucide-react';

type LayoutProps = {
  children: ReactNode;
  currentTab: string;
  onTabChange: (tab: string) => void;
};

export function Layout({ children, currentTab, onTabChange }: LayoutProps) {
  const { profile, signOut } = useAuth();

  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'profiles', label: 'Profiles', icon: Users },
    { id: 'notes', label: 'Notes', icon: BookOpen },
    { id: 'chat', label: 'Chat', icon: MessageCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Home className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">Campus Connect</span>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => onTabChange(tab.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition ${
                      currentTab === tab.id
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-sm">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-gray-700 font-medium">{profile?.name}</span>
              </div>
              <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                <LogOut className="w-5 h-5" />
                <span className="hidden sm:inline font-medium">Logout</span>
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center justify-around py-2 border-t">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex flex-col items-center space-y-1 p-2 rounded-lg transition ${
                    currentTab === tab.id
                      ? 'text-blue-600'
                      : 'text-gray-600'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}
