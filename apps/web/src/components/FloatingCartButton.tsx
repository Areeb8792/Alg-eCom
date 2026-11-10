import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingBag } from 'lucide-react';

interface FloatingCartButtonProps {
  itemCount: number;
}

export const FloatingCartButton: React.FC<FloatingCartButtonProps> = ({ itemCount }) => {
  return (
    <Link
      to="/bag"
      aria-label="View shopping bag"
      className="fixed top-6 right-6 lg:top-8 lg:right-8 z-50 w-14 h-14 lg:w-16 lg:h-16 bg-white rounded-full flex items-center justify-center transition-transform hover:scale-110 sharp-shadow group text-ink"
    >
      <ShoppingBag className="w-5 h-5 lg:w-6 lg:h-6 text-ink group-hover:scale-105 transition-transform" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-accentRed text-white text-[10px] w-6 h-6 flex items-center justify-center rounded-full font-bold border-2 border-white animate-pulse">
          {itemCount}
        </span>
      )}
    </Link>
  );
};
