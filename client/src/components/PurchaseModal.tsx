import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { Button } from './Button';

interface PurchaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPurchase: (type: 'ONE_TIME' | 'LIFETIME') => void;
  title: string;
  priceOneTime: number;
  priceLifetime: number;
  loading: boolean;
}

export const PurchaseModal = ({
  isOpen,
  onClose,
  onPurchase,
  title,
  priceOneTime,
  priceLifetime,
  loading
}: PurchaseModalProps) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-xl"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-white">Unlock Access</h2>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <X size={24} />
              </button>
            </div>

            <p className="text-gray-300 mb-6">
              You need to purchase access to watch <span className="text-primary font-semibold">{title}</span>.
            </p>

            <div className="mb-6 flex gap-2 justify-center">
              {['EasyPaisa', 'JazzCash', 'Visa', 'Mastercard'].map((method) => (
                 <span key={method} className="px-2 py-1 bg-white/5 rounded text-[10px] text-gray-400 border border-white/5">
                   {method}
                 </span>
              ))}
            </div>

            <div className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-primary/50 transition-colors cursor-pointer" onClick={() => onPurchase('ONE_TIME')}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white">One-Time Rental</h3>
                  <span className="text-xl font-bold text-primary">₹{priceOneTime}</span>
                </div>
                <p className="text-sm text-gray-400">Watch this movie once. Access expires after 48 hours.</p>
              </div>

              <div className="bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20 rounded-xl p-4 hover:border-primary transition-colors cursor-pointer" onClick={() => onPurchase('LIFETIME')}>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-white">Lifetime Access</h3>
                  <span className="text-xl font-bold text-primary">₹{priceLifetime}</span>
                </div>
                <p className="text-sm text-gray-400">Unlimited access to all movies forever. Best value!</p>
              </div>
            </div>

            {loading && (
              <div className="mt-4 text-center text-sm text-gray-400 animate-pulse">
                Processing payment...
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
