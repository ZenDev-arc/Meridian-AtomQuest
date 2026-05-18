import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { LogOut, Moon, Sun } from 'lucide-react';

export default function MainLayout() {
  const { user, logout } = useAuth();
  const location = useLocation();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', String(isDarkMode));
  }, [isDarkMode]);

  return (
    <div className="min-h-screen flex flex-col bg-meridian-parchment text-meridian-ink font-sans">
      {/* Top Header - Dark - Full Screen Width */}
      <header className="h-12 bg-[#1a1612] flex-shrink-0 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <div className="flex items-baseline gap-[1px]">
            <span className="text-white font-serif text-xl font-bold tracking-tight">Meri</span>
            <span className="text-meridian-gold font-serif text-xl italic tracking-tight">dian</span>
          </div>

          <nav className="flex gap-3 font-mono text-[9px] uppercase tracking-wider font-bold">
            <Link
              to="/"
              className={`px-2.5 py-1 border rounded-sm transition-all ${
                location.pathname === '/'
                  ? 'border-meridian-gold text-meridian-gold bg-meridian-gold/5'
                  : 'border-transparent text-white/40 hover:text-white'
              }`}
            >
              Field Canvas
            </Link>

            {user?.role === 'MANAGER' && (
              <Link
                to="/team"
                className={`px-2.5 py-1 border rounded-sm transition-all ${
                  location.pathname === '/team'
                    ? 'border-meridian-gold text-meridian-gold bg-meridian-gold/5'
                    : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                Team Dossiers
              </Link>
            )}

            {user?.role === 'ADMIN' && (
              <Link
                to="/admin"
                className={`px-2.5 py-1 border rounded-sm transition-all ${
                  location.pathname === '/admin'
                    ? 'border-meridian-gold text-meridian-gold bg-meridian-gold/5'
                    : 'border-transparent text-white/40 hover:text-white'
                }`}
              >
                Admin Switchboard
              </Link>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 text-white/50 font-mono text-[10px] uppercase tracking-widest">
            <span className="text-white/30 font-semibold">FY 2025 – 26</span>
            <span className="text-meridian-gold">●</span>
            <span className="text-white/80">{user?.name}</span>
            <span className="text-white/30">·</span>
            <span>{user?.role}</span>
          </div>
          
          <button onClick={() => setIsDarkMode(!isDarkMode)} className="text-white/30 hover:text-white transition-colors" title="Toggle Dark Mode">
            {isDarkMode ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          
          <button onClick={logout} className="text-white/30 hover:text-white transition-colors" title="Sign Out">
            <LogOut size={13} />
          </button>
        </div>
      </header>

      {/* Page Content Wrapper - Fills Screen */}
      <div className="flex-1 flex overflow-hidden bg-meridian-parchment">
        <Outlet />
      </div>
    </div>
  );
}
