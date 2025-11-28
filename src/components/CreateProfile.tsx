import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { UserCircle } from 'lucide-react';

export function CreateProfile() {
  const { user, refreshProfile } = useAuth();
  const [name, setName] = useState('');
  const [collegeName, setCollegeName] = useState('');
  const [course, setCourse] = useState('');
  const [uniqueTrait, setUniqueTrait] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError('');

    const { error: insertError } = await supabase.from('profiles').insert({
      id: user.id,
      name,
      college_name: collegeName,
      course,
      unique_trait: uniqueTrait,
    });

    if (insertError) {
      setError(insertError.message);
    } else {
      await refreshProfile();
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-blue-600 p-3 rounded-full mb-4">
            <UserCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Create Your Profile</h2>
          <p className="text-gray-600 mt-2">Tell us about yourself</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              College Name
            </label>
            <input
              type="text"
              value={collegeName}
              onChange={(e) => setCollegeName(e.target.value)}
              placeholder="e.g., Miranda House, St. Stephen's College"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Course
            </label>
            <input
              type="text"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
              placeholder="e.g., B.Sc Computer Science, B.A Economics"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Something Unique About You
            </label>
            <textarea
              value={uniqueTrait}
              onChange={(e) => setUniqueTrait(e.target.value)}
              placeholder="What makes you special? A talent, hobby, or interesting fact..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-24 resize-none"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg"
          >
            {loading ? 'Creating Profile...' : 'Create Profile'}
          </button>
        </form>
      </div>
    </div>
  );
}
