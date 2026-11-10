import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
  onClick: () => void;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ itemCount, onClick }) => {
  return (
    <button
      onClick={onClick}
      aria-label="View shopping bag"
      className="fixed top-8 right-8 z-50 w-16 h-16 bg-white rounded-full flex items-center justify-center transition-transform hover:scale-110 sharp-shadow group"
    >
      <ShoppingBag className="w-6 h-6 text-ink group-hover:scale-105 transition-transform" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-accentRed text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold border-2 border-white animate-pulse">
          {itemCount}
        </span>
      )}
    </button>
  );
};
