import { useState, useEffect } from 'react';
import { Play, Users, Film } from 'lucide-react';
import { useWatchParty } from '../contexts/WatchPartyContext';

export function HomePage() {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [userName, setUserName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [movieUrl, setMovieUrl] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [roomId, setRoomId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { createRoom, joinRoom } = useWatchParty();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const roomParam = params.get('room');
    if (roomParam) {
      setRoomId(roomParam);
      setMode('join');
    }
  }, []);

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await createRoom(roomName, movieUrl, movieTitle, userName);
    } catch (err: any) {
      console.error('Error creating room:', err);
      setError(err.message || 'Failed to create room. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await joinRoom(roomId, userName);
    } catch (err) {
      setError('Failed to join room. Please check the room ID.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {mode === 'menu' && (
          <div className="text-center space-y-8 animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="bg-gradient-to-br from-red-600 to-red-800 p-6 rounded-3xl shadow-2xl">
                <Film size={64} className="text-white" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-5xl md:text-6xl font-bold text-white tracking-tight">
                Watch Together
              </h1>
              <p className="text-xl text-gray-400 max-w-md mx-auto">
                Experience movies with friends in real-time, no matter where you are
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4 pt-8">
              <button
                onClick={() => setMode('create')}
                className="group relative bg-gradient-to-br from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white p-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white/10 p-4 rounded-xl group-hover:bg-white/20 transition-colors">
                    <Play size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Start a Party</h3>
                    <p className="text-red-100 text-sm">Host a movie night</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setMode('join')}
                className="group relative bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white p-8 rounded-2xl shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl"
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="bg-white/10 p-4 rounded-xl group-hover:bg-white/20 transition-colors">
                    <Users size={32} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-2">Join a Party</h3>
                    <p className="text-blue-100 text-sm">Enter a room code</p>
                  </div>
                </div>
              </button>
            </div>
          </div>
        )}

        {mode === 'create' && (
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800 animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-6">Start Watch Party</h2>

            <form onSubmit={handleCreateRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room Name
                </label>
                <input
                  type="text"
                  value={roomName}
                  onChange={(e) => setRoomName(e.target.value)}
                  placeholder="e.g., Movie Night with Friends"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Movie Title
                </label>
                <input
                  type="text"
                  value={movieTitle}
                  onChange={(e) => setMovieTitle(e.target.value)}
                  placeholder="Enter movie title"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Movie URL
                </label>
                <input
                  type="url"
                  value={movieUrl}
                  onChange={(e) => setMovieUrl(e.target.value)}
                  placeholder="https://example.com/movie.mp4"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent transition-all"
                />
                <p className="text-xs text-gray-500 mt-2">
                  Direct link to video file (MP4, WebM, etc.)
                </p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </div>
        )}

        {mode === 'join' && (
          <div className="bg-gray-900 rounded-2xl shadow-2xl p-8 border border-gray-800 animate-fade-in">
            <h2 className="text-3xl font-bold text-white mb-6">Join Watch Party</h2>

            <form onSubmit={handleJoinRoom} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Room ID
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  placeholder="Enter room ID"
                  required
                  className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-transparent transition-all"
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500 text-red-500 px-4 py-3 rounded-xl text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setMode('menu')}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 text-white py-3 rounded-xl font-medium transition-colors"
                  disabled={loading}
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Joining...' : 'Join Room'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
      `}</style>
    </div>
  );
}
