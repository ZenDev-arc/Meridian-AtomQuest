import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      setError('');
      const response = await api.post('/auth/login', data);
      login(response.data.accessToken, response.data.user);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to login');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-meridian-parchment">
      <div className="bg-meridian-ink text-meridian-parchment p-10 shadow-2xl max-w-md w-full relative overflow-hidden">
        {/* Subtle decorative circle mapping to the topographic theme */}
        <div className="absolute -top-16 -right-16 w-32 h-32 rounded-full border border-white/5"></div>
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full border border-white/5"></div>
        
        <h1 className="text-4xl font-serif text-meridian-gold mb-2 text-center tracking-wide">Meridian</h1>
        <p className="text-center opacity-60 text-sm mb-8 font-mono uppercase tracking-widest">Goal Tracking Portal</p>
        
        {error && (
          <div className="bg-status-risk/10 text-status-risk p-3 mb-6 border-l-4 border-status-risk font-mono text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 relative z-10">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-2 opacity-70">Email Address</label>
            <input
              type="email"
              {...register('email')}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors rounded-none"
              placeholder="user@organization.com"
            />
            {errors.email && <p className="text-status-risk text-xs mt-2 font-mono">{errors.email.message}</p>}
          </div>
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider mb-2 opacity-70">Password</label>
            <input
              type="password"
              {...register('password')}
              className="w-full bg-white/5 border border-white/10 px-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-meridian-gold transition-colors rounded-none"
              placeholder="••••••••"
            />
            {errors.password && <p className="text-status-risk text-xs mt-2 font-mono">{errors.password.message}</p>}
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-meridian-gold text-meridian-ink font-bold py-3 mt-4 hover:bg-white hover:text-meridian-ink transition-colors uppercase tracking-widest text-sm"
          >
            {isSubmitting ? 'Authenticating...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
