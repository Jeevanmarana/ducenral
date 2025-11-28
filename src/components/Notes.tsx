import { useState, useEffect } from 'react';
import { supabase, Note, Subject } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { BookOpen, Plus, Search, FileText, X } from 'lucide-react';

export function Notes() {
  const { user } = useAuth();
  const [notes, setNotes] = useState<(Note & { subjects?: Subject; profiles?: { name: string } })[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const categories = ['all', 'BCP', 'SEC', 'GE', 'VAC', 'AEC'];

  useEffect(() => {
    fetchSubjects();
    fetchNotes();
  }, []);

  const fetchSubjects = async () => {
    const { data, error } = await supabase
      .from('subjects')
      .select('*')
      .order('name');

    if (!error && data) {
      setSubjects(data);
    }
  };

  const fetchNotes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*, subjects(*), profiles(name)')
      .order('created_at', { ascending: false });

    if (!error && data) {
      setNotes(data);
    }
    setLoading(false);
  };

  const filteredNotes = notes.filter((note) => {
    const matchesCategory = selectedCategory === 'all' || note.subjects?.category === selectedCategory;
    const matchesSearch = note.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      note.subjects?.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Study Materials</h1>
          <p className="text-gray-600">Access notes and resources for all subjects</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          <Plus className="w-5 h-5" />
          <span className="hidden sm:inline">Add Note</span>
        </button>
      </div>

      <div className="mb-6 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {category.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p className="mt-2 text-gray-600">Loading notes...</p>
        </div>
      ) : filteredNotes.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No notes found</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredNotes.map((note) => (
            <div
              key={note.id}
              className="bg-white rounded-xl shadow-sm hover:shadow-md transition p-6 border border-gray-100"
            >
              <div className="flex items-start space-x-3 mb-3">
                <div className="bg-green-100 p-2 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1 line-clamp-2">
                    {note.title}
                  </h3>
                  {note.subjects && (
                    <span className="inline-block text-xs font-medium px-2 py-1 bg-blue-100 text-blue-700 rounded">
                      {note.subjects.category} - {note.subjects.name}
                    </span>
                  )}
                </div>
              </div>

              <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                {note.content}
              </p>

              {note.profiles && (
                <p className="text-xs text-gray-500">
                  Uploaded by {note.profiles.name}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AddNoteModal
          subjects={subjects}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchNotes();
          }}
        />
      )}
    </div>
  );
}

function AddNoteModal({
  subjects,
  onClose,
  onSuccess,
}: {
  subjects: Subject[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    const { error } = await supabase.from('notes').insert({
      title,
      content,
      subject_id: subjectId,
      uploaded_by: user.id,
    });

    if (!error) {
      onSuccess();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">Add New Note</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.category} - {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Content
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-48 resize-none"
              required
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
