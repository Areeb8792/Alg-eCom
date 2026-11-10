import React from 'react';

interface MainHeaderProps {
  activeTab: string;
  onNavigate: (tab: string) => void;
  cartCount: number;
}

export const MainHeader: React.FC<MainHeaderProps> = ({ activeTab, onNavigate }) => {
  return (
    <header className="fixed top-0 left-0 w-full z-40 p-8 flex justify-between items-start mix-blend-diff text-white">
      <div className="flex flex-col cursor-pointer" onClick={() => onNavigate('catalog')}>
        <span className="anton-heading text-4xl lg:text-6xl tracking-tighter">HEAVY</span>
        <span className="space-grotesk text-[10px] tracking-[0.3em] uppercase opacity-80 mt-1">
          Est. 2024 / NYC
        </span>
      </div>

      <nav className="mr-32 flex flex-col items-end gap-3 space-grotesk">
        <button
          onClick={() => onNavigate('catalog')}
          className={`nav-link text-xs font-bold uppercase transition-all ${
            activeTab === 'catalog' ? 'line-through' : ''
          }`}
        >
          ESSENTIALS
        </button>
        <button
          onClick={() => onNavigate('catalog')}
          className="nav-link text-xs font-bold uppercase transition-all"
        >
          COLLECTIONS
        </button>
        <button
          onClick={() => onNavigate('track')}
          className={`nav-link text-xs font-bold uppercase transition-all ${
            activeTab === 'track' ? 'line-through' : ''
          }`}
        >
          ORDER STATUS
        </button>
        <button
          onClick={() => onNavigate('admin')}
          className={`nav-link text-xs font-bold uppercase transition-all text-amber-300 ${
            activeTab === 'admin' ? 'line-through' : ''
          }`}
        >
          OPERATIONS (ADMIN)
        </button>
      </nav>
    </header>
  );
};
