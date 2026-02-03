import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Star, Lock } from 'lucide-react';
import { Button } from './Button';
import { useAuth } from '../contexts/AuthContext';
import { useWatchParty } from '../contexts/WatchPartyContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { PurchaseModal } from './PurchaseModal';

interface MovieProps {
  id: number;
  title: string;
  image: string;
  genre: string[];
  rating: number;
  year: number;
  price: number;
  videoUrl?: string;
  subtitlesUrl?: string;
}

declare global {
  interface Window {
    Razorpay: any;
  }
}

export const MovieCard = ({ id, title, image, genre, rating, year, price, videoUrl, subtitlesUrl }: MovieProps) => {
  const { user } = useAuth();
  const { createRoom } = useWatchParty();
  const navigate = useNavigate();
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const startWatchParty = async () => {
    if (!videoUrl) {
      alert('Video not available');
      return;
    }
    try {
      await createRoom(title, videoUrl, title, user?.name || 'User', subtitlesUrl);
      navigate('/watch');
    } catch (error) {
      console.error('Failed to create room:', error);
      alert('Failed to start watch party');
    }
  };

  const handleWatch = async () => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/api/payments/check-access/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      if (response.data.hasAccess) {
        await startWatchParty();
      } else {
        setIsPurchaseModalOpen(true);
      }
    } catch (error) {
      console.error('Check access failed:', error);
      alert('Failed to check access. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handlePurchase = async (type: 'ONE_TIME' | 'LIFETIME') => {
    setLoading(true);
    try {
      // 1. Create Order
      const orderResponse = await axios.post(
        'http://localhost:3000/api/payments/create-order',
        { movieId: id, type },
        { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
      );

      const { orderId, amount, currency, keyId } = orderResponse.data;

      // 2. Open Razorpay
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'Watch Together',
        description: `Access to ${title}`,
        order_id: orderId,
        handler: async function (response: any) {
          // 3. Verify Payment
          try {
            const verifyResponse = await axios.post(
              'http://localhost:3000/api/payments/verify-payment',
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                movieId: id,
                type,
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem('token')}` } }
            );

            if (verifyResponse.data.success) {
              alert('Payment successful!');
              setIsPurchaseModalOpen(false);
              await startWatchParty();
            }
          } catch (error) {
            console.error('Verification failed:', error);
            alert('Payment verification failed. Please contact support.');
          }
        },
        prefill: {
          name: user?.name,
          email: user?.email,
        },
        theme: {
          color: '#E50914',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Failed to initiate purchase. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <motion.div 
        className="group relative rounded-xl overflow-hidden bg-card border border-white/5 shadow-xl"
        whileHover={{ y: -10 }}
      >
        <div className="aspect-[2/3] overflow-hidden relative">
          <motion.img 
            src={image} 
            alt={title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center p-4">
            <Button 
              className="w-full mb-3" 
              variant="primary"
              onClick={handleWatch}
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin mr-2">⏳</span>
              ) : (
                <Play className="w-4 h-4 mr-2" />
              )}
              Watch Now
            </Button>
            <div className="text-center">
              <p className="text-white font-bold text-lg">₹{price}</p>
              <p className="text-gray-400 text-sm line-through">₹{price * 2}</p>
            </div>
          </div>
          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md flex items-center gap-1">
            <Star className="w-3 h-3 text-yellow-400 fill-current" />
            <span className="text-xs font-medium text-white">{rating}</span>
          </div>
        </div>
        
        <div className="p-4">
          <h3 className="text-lg font-bold text-white mb-1 truncate">{title}</h3>
          <div className="flex items-center justify-between text-sm text-gray-400 mb-3">
            <span>{year}</span>
            <span>{genre[0]}</span>
          </div>
          <div className="flex gap-2">
            {genre.slice(0, 2).map((g) => (
              <span key={g} className="text-xs px-2 py-1 rounded-full bg-white/5 text-gray-300 border border-white/5">
                {g}
              </span>
            ))}
          </div>
        </div>
      </motion.div>

      <PurchaseModal
        isOpen={isPurchaseModalOpen}
        onClose={() => setIsPurchaseModalOpen(false)}
        onPurchase={handlePurchase}
        title={title}
        priceOneTime={75}
        priceLifetime={300}
        loading={loading}
      />
    </>
  );
};
