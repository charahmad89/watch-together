import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Film, Clock, CreditCard, LogOut } from 'lucide-react';

export function Dashboard() {
  const { user, logout } = useAuth();

  // Mock data for demonstration since we might not have a full backend fetch for these yet
  const purchases = [
    { id: 1, movie: "Inception", type: "LIFETIME", amount: 300, date: "2024-03-10" },
    { id: 2, movie: "Interstellar", type: "ONE_TIME", amount: 75, date: "2024-03-12" }
  ];

  const recentRooms = [
    { id: "1", name: "Sci-Fi Night", date: "2024-03-14" },
    { id: "2", name: "Comedy Marathon", date: "2024-03-15" }
  ];

  if (!user) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center text-white">
        <p>Please log in to view your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Profile Header */}
        <div className="bg-card border border-white/10 rounded-2xl p-8 flex flex-col md:flex-row items-center gap-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-3xl font-bold text-white">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl font-bold text-white">{user.name || 'User'}</h1>
            <p className="text-gray-400">{user.email}</p>
            <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-4">
              <span className="px-3 py-1 rounded-full bg-primary/20 text-primary text-sm border border-primary/20">
                Free Plan
              </span>
              <span className="px-3 py-1 rounded-full bg-white/5 text-gray-300 text-sm border border-white/10">
                Member since 2024
              </span>
            </div>
          </div>
          <button 
            onClick={logout}
            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
          >
            <LogOut size={20} />
            Sign Out
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-blue-500/20 text-blue-400">
                <CreditCard size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Total Spent</p>
                <p className="text-2xl font-bold text-white">₹375</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-purple-500/20 text-purple-400">
                <Film size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Movies Owned</p>
                <p className="text-2xl font-bold text-white">2</p>
              </div>
            </div>
          </div>
          <div className="bg-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-lg bg-green-500/20 text-green-400">
                <Clock size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Watch Time</p>
                <p className="text-2xl font-bold text-white">12.5h</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Purchases */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Purchase History</h2>
          <div className="bg-card border border-white/10 rounded-2xl overflow-hidden">
            {purchases.map((purchase) => (
              <div key={purchase.id} className="p-6 border-b border-white/5 last:border-0 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-gray-800 flex items-center justify-center">
                    <Film className="text-gray-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{purchase.movie}</h3>
                    <p className="text-sm text-gray-400">{purchase.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-white">₹{purchase.amount}</p>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    purchase.type === 'LIFETIME' ? 'bg-gold/20 text-gold' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {purchase.type.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Rooms */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white">Recent Watch Parties</h2>
          <div className="grid md:grid-cols-2 gap-4">
            {recentRooms.map((room) => (
              <div key={room.id} className="bg-card border border-white/10 rounded-2xl p-6 hover:border-primary/50 transition-colors cursor-pointer group">
                <div className="flex justify-between items-start mb-4">
                  <div className="p-3 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                    <Clock size={24} />
                  </div>
                  <span className="text-sm text-gray-400">{room.date}</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{room.name}</h3>
                <p className="text-sm text-gray-400">Hosted by You</p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
