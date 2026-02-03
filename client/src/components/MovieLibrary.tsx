import React, { useState, useEffect } from 'react';
import { Navbar } from './Navbar';
import { MovieCard } from './MovieCard';
import { Button } from './Button';
import { motion } from 'framer-motion';
import { Search, Filter, Upload } from 'lucide-react';
import { UploadVideoModal } from './UploadVideoModal';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

interface Movie {
  id: number;
  title: string;
  thumbnail: string;
  description: string;
  price: number;
  videoUrl: string;
  subtitlesUrl?: string;
}

export const MovieLibrary = () => {
  const { user } = useAuth();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [movies, setMovies] = useState<Movie[]>([]);

  const fetchMovies = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/videos');
      setMovies(response.data);
    } catch (error) {
      console.error('Failed to fetch movies:', error);
    }
  };

  useEffect(() => {
    fetchMovies();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-12">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Movie Library</h1>
            <p className="text-gray-400">Discover and watch amazing movies with friends</p>
          </div>
          
          <div className="flex gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input 
                type="text" 
                placeholder="Search movies..." 
                className="bg-white/5 border border-white/10 rounded-lg pl-10 pr-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-primary/50 w-full md:w-64"
              />
            </div>
            <Button variant="outline" className="px-4">
              <Filter className="w-5 h-5" />
            </Button>
            
            {user && (
              <Button onClick={() => setIsUploadModalOpen(true)} className="px-4">
                <Upload className="w-5 h-5 mr-2" />
                Upload
              </Button>
            )}
          </div>
        </div>

        {/* Pricing Banner */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/20 rounded-2xl p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Premium Access</h2>
            <p className="text-gray-300">Unlock unlimited streaming for a lifetime or pay per movie.</p>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <p className="text-sm text-gray-400 line-through">₹500</p>
              <p className="text-2xl font-bold text-white">₹300</p>
              <p className="text-xs text-primary">Lifetime Access</p>
            </div>
            <Button size="lg" className="h-auto px-8">Get Started</Button>
          </div>
        </motion.div>

        {/* Movies Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map((movie, index) => (
            <motion.div
              key={movie.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <MovieCard 
                id={movie.id}
                title={movie.title}
                image={movie.thumbnail}
                genre={['Action']} // hardcoded
                rating={4.5} // hardcoded
                year={2024} // hardcoded
                price={movie.price}
                videoUrl={movie.videoUrl}
                subtitlesUrl={movie.subtitlesUrl}
              />
            </motion.div>
          ))}
        </div>
      </main>

      <UploadVideoModal 
        isOpen={isUploadModalOpen} 
        onClose={() => setIsUploadModalOpen(false)}
        onUploadSuccess={fetchMovies}
      />
    </div>
  );
};
