import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './Button';
import { Input } from './Input';
import { Logo } from './Logo';
import { Mail, Lock, User, Github, Facebook } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

export const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, register } = useAuth();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isLogin) {
        const response = await axios.post('http://localhost:3000/api/auth/login', {
          email: formData.email,
          password: formData.password,
        });
        login(response.data.token, response.data.user);
        navigate('/');
      } else {
        const response = await axios.post('http://localhost:3000/api/auth/register', {
          email: formData.email,
          password: formData.password,
          name: formData.name,
        });
        register(response.data.token, response.data.user);
        navigate('/');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Blobs */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px]" />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md"
      >
        <div className="glass-panel rounded-2xl p-8 relative overflow-hidden">
          <div className="flex justify-center mb-8">
            <Link to="/">
              <Logo />
            </Link>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={isLogin ? 'login' : 'signup'}
              initial={{ x: isLogin ? -20 : 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isLogin ? 20 : -20, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <h2 className="text-2xl font-bold text-center mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h2>
              <p className="text-center text-gray-400 mb-8">
                {isLogin ? 'Enter your details to access your account' : 'Join us and start watching together'}
              </p>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-3 rounded-lg mb-4 text-sm text-center">
                  {error}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleSubmit}>
                {!isLogin && (
                  <Input 
                    id="name"
                    label="Full Name"
                    placeholder="John Doe"
                    icon={<User className="w-5 h-5" />}
                    value={formData.name}
                    onChange={handleChange}
                  />
                )}
                <Input 
                  id="email"
                  type="email"
                  label="Email Address"
                  placeholder="john@example.com"
                  icon={<Mail className="w-5 h-5" />}
                  value={formData.email}
                  onChange={handleChange}
                />
                <Input 
                  id="password"
                  type="password"
                  label="Password"
                  placeholder="••••••••"
                  icon={<Lock className="w-5 h-5" />}
                  value={formData.password}
                  onChange={handleChange}
                />

                {isLogin && (
                  <div className="flex items-center justify-between text-sm">
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="rounded bg-white/10 border-white/20 text-primary focus:ring-primary" />
                      <span className="text-gray-400 group-hover:text-white transition-colors">Remember me</span>
                    </label>
                    <a href="#" className="text-primary hover:text-accent transition-colors">Forgot password?</a>
                  </div>
                )}

                <Button className="w-full mt-6" disabled={loading}>
                  {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm">
                <span className="text-gray-400">
                  {isLogin ? "Don't have an account?" : "Already have an account?"}
                </span>
                <button
                  onClick={() => setIsLogin(!isLogin)}
                  className="ml-2 text-primary hover:text-accent transition-colors font-medium"
                >
                  {isLogin ? 'Sign Up' : 'Sign In'}
                </button>
              </div>

              <div className="mt-8">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-[#161626] text-gray-400">Or continue with</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-6">
                  <Button variant="outline" className="w-full">
                    <Github className="w-5 h-5 mr-2" />
                    Github
                  </Button>
                  <Button variant="outline" className="w-full">
                    <Facebook className="w-5 h-5 mr-2" />
                    Facebook
                  </Button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};
