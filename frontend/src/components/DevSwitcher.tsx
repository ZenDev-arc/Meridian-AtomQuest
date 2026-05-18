import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, User, Shield, Terminal, ArrowRight } from 'lucide-react';

export default function DevSwitcher() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);

  const profiles = [
    {
      name: 'Rohan Verma',
      role: 'EMPLOYEE',
      email: 'employee@meridian.co',
      password: 'meridian_employee',
      path: '/',
      icon: User,
      color: '#4e7a62',
    },
    {
      name: 'Priya Sharma',
      role: 'MANAGER',
      email: 'manager@meridian.co',
      password: 'meridian_manager',
      path: '/team',
      icon: Shield,
      color: '#c8873a',
    },
    {
      name: 'Arjun Mehta',
      role: 'ADMIN',
      email: 'admin@meridian.co',
      password: 'meridian_admin',
      path: '/admin',
      icon: ShieldAlert,
      color: '#7e6b8f',
    },
  ];

  const handleSwitch = async (profile: typeof profiles[0]) => {
    setIsSwitching(true);
    try {
      const response = await api.post('/auth/login', {
        email: profile.email,
        password: profile.password,
      });
      login(response.data.accessToken, response.data.user);
      navigate(profile.path);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to quick-switch role:', err);
    } finally {
      setIsSwitching(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 font-mono text-xs">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-meridian-ink text-meridian-gold border border-meridian-gold/20 flex items-center justify-center shadow-2xl hover:bg-meridian-gold hover:text-meridian-ink transition-all duration-300"
        title="Developer Quick Switcher"
      >
        <Terminal size={18} />
      </button>

      {/* Switcher Panel */}
      {isOpen && (
        <div className="absolute bottom-12 right-0 w-64 bg-meridian-ink text-white rounded border border-white/10 shadow-2xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-2">
            <span className="text-[10px] uppercase font-bold tracking-widest text-meridian-gold">
              Dev Switchboard
            </span>
            {isSwitching && <span className="animate-pulse text-[9px] text-white/50">Switching…</span>}
          </div>

          <div className="space-y-2">
            {profiles.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.role}
                  disabled={isSwitching}
                  onClick={() => handleSwitch(p)}
                  className="w-full flex items-center justify-between p-2 rounded bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 text-left transition-all duration-200"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{ backgroundColor: `${p.color}22`, color: p.color }}
                    >
                      <Icon size={14} />
                    </div>
                    <div>
                      <p className="font-bold text-white leading-tight">{p.name}</p>
                      <p className="text-[9px] text-white/40 uppercase tracking-wider mt-0.5">{p.role}</p>
                    </div>
                  </div>
                  <ArrowRight size={12} className="text-white/30" />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
