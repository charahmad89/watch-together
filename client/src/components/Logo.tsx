import React from 'react';
import { Play } from 'lucide-react';
import { motion } from 'framer-motion';

export const Logo = () => {
  return (
    <div className="flex items-center gap-2 group cursor-pointer">
      <motion.div 
        className="relative w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center shadow-lg shadow-primary/30"
        whileHover={{ rotateY: 180, scale: 1.1 }}
        transition={{ duration: 0.6, type: "spring" }}
        style={{ transformStyle: "preserve-3d" }}
      >
        <div className="absolute inset-0 bg-white/20 rounded-xl backdrop-blur-sm" />
        <Play className="w-5 h-5 text-white fill-current relative z-10" />
      </motion.div>
      <div className="flex flex-col">
        <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-white/80 group-hover:from-primary group-hover:to-accent transition-all duration-300">
          WatchTogether
        </span>
      </div>
    </div>
  );
};
