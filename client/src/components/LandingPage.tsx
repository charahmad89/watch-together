import React from 'react';
import { motion } from 'framer-motion';
import { Play, Users, Tv, MessageCircle } from 'lucide-react';
import { Button } from './Button';
import { Navbar } from './Navbar';
import { Link } from 'react-router-dom';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-background pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-primary to-accent mb-6"
            >
              Watch Movies Together, Anywhere.
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-xl text-gray-400 mb-8"
            >
              Stream your favorite movies and shows in perfect sync with friends. 
              Real-time chat, crystal clear video, and unforgettable moments.
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex items-center justify-center gap-4"
            >
              <Link to="/auth">
                <Button size="lg" className="group">
                  Start Watching
                  <Play className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
                Learn More
              </Button>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-black/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Users className="w-8 h-8 text-primary" />}
              title="Real-time Sync"
              description="Never miss a beat. Video playback is perfectly synchronized for everyone in the room."
            />
            <FeatureCard 
              icon={<MessageCircle className="w-8 h-8 text-accent" />}
              title="Live Chat"
              description="Discuss the plot, share reactions, and hang out with built-in voice and text chat."
            />
            <FeatureCard 
              icon={<Tv className="w-8 h-8 text-blue-500" />}
              title="HD Streaming"
              description="Enjoy high-quality video streaming with low latency for the best viewing experience."
            />
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => {
  return (
    <motion.div 
      whileHover={{ y: -10 }}
      className="p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors"
    >
      <div className="w-14 h-14 rounded-xl bg-white/5 flex items-center justify-center mb-6">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-white mb-3">{title}</h3>
      <p className="text-gray-400 leading-relaxed">{description}</p>
    </motion.div>
  );
};
