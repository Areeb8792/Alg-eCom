import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface MainHeaderProps {
  cartCount: number;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ cartCount }) => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <header className="fixed top-0 left-0 w-full z-40 p-6 lg:p-8 flex justify-between items-start mix-blend-diff text-white pointer-events-none">
      <div className="flex flex-col pointer-events-auto">
        <Link to="/" className="group inline-block">
          <span className="anton-heading text-4xl lg:text-6xl tracking-tighter block leading-none">HEAVY</span>
          <span className="space-grotesk text-[10px] tracking-[0.3em] uppercase opacity-80 mt-1 block">
            Est. 2024 / NYC
          </span>
        </Link>
      </div>

      <nav className="mr-24 lg:mr-28 flex flex-col items-end gap-2.5 space-grotesk pointer-events-auto">
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
