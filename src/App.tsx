import { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Auth } from './components/Auth';
import { CreateProfile } from './components/CreateProfile';
import { Layout } from './components/Layout';
import { Home } from './components/Home';
import { Profiles } from './components/Profiles';
import { Notes } from './components/Notes';
import { Chat } from './components/Chat';

function AppContent() {
  const { user, profile, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('home');

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (!profile) {
    return <CreateProfile />;
  }

  const renderContent = () => {
    switch (currentTab) {
      case 'home':
        return <Home onTabChange={setCurrentTab} />;
      case 'profiles':
        return <Profiles />;
      case 'notes':
        return <Notes />;
      case 'chat':
        return <Chat />;
      default:
        return <Home onTabChange={setCurrentTab} />;
    }
  };

  return (
    <Layout currentTab={currentTab} onTabChange={setCurrentTab}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
