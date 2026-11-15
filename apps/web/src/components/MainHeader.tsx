import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.js';

interface MainHeaderProps {
  cartCount: number;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ cartCount }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const { user, isAuthenticated, openAuthModal } = useAuth();

  return (
    <header className="fixed top-0 left-0 w-full z-40 p-6 lg:p-8 flex justify-between items-start mix-blend-diff text-white pointer-events-none">
      <div className="flex flex-col pointer-events-auto">
        <Link to="/" className="group inline-block">
          <span className="anton-heading text-4xl lg:text-6xl tracking-tighter block leading-none">HEAVY</span>
          <span className="space-grotesk text-[10px] tracking-[0.3em] uppercase opacity-80 mt-1 block">
            SEASON 04 // NYC
          </span>
        </Link>
      </div>

      <nav className="mr-24 lg:mr-28 flex flex-col items-end gap-2.5 space-grotesk pointer-events-auto font-mono">
        <Link
          to="/"
          className={`nav-link text-xs font-bold uppercase transition-all hover:line-through ${
            currentPath === '/' ? 'line-through' : ''
          }`}
        >
          ESSENTIALS
        </Link>
        <Link
          to="/collections/outerwear"
          className={`nav-link text-xs font-bold uppercase transition-all hover:line-through ${
            currentPath.startsWith('/collections') ? 'line-through' : ''
          }`}
        >
          COLLECTIONS
        </Link>
        <Link
          to="/bag"
          className={`nav-link text-xs font-bold uppercase transition-all hover:line-through flex items-center gap-1.5 ${
            currentPath === '/bag' ? 'line-through' : ''
          }`}
        >
          BAG {cartCount > 0 && <span className="text-[10px] bg-white text-ink px-1 font-mono font-bold">({cartCount})</span>}
        </Link>

        {/* Customer Identity Link / Button */}
        {isAuthenticated && user ? (
          <Link
            to="/account"
            className={`nav-link text-xs font-bold uppercase transition-all hover:line-through flex items-center gap-1.5 text-green-300 ${
              currentPath === '/account' ? 'line-through' : ''
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${user.is_verified ? 'bg-green-400' : 'bg-amber-400'}`} />
            DOSSIER: {user.full_name.split(' ')[0].toUpperCase()}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => openAuthModal('LOGIN')}
            className="nav-link text-xs font-bold uppercase transition-all hover:line-through text-left text-neutral-300"
          >
            [SIGN IN / REGISTER]
          </button>
        )}

        <Link
          to="/track-order"
          className={`nav-link text-xs font-bold uppercase transition-all hover:line-through ${
            currentPath === '/track-order' || currentPath.startsWith('/orders') ? 'line-through' : ''
          }`}
        >
          ORDER STATUS
        </Link>
        <Link
          to="/admin"
          className={`nav-link text-xs font-bold uppercase transition-all hover:line-through text-amber-300 ${
            currentPath.startsWith('/admin') ? 'line-through' : ''
          }`}
        >
          OPERATIONS (ADMIN)
        </Link>
      </nav>
    </header>
  );
};
