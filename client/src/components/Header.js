import React from 'react';
import { Bars3Icon } from '@heroicons/react/24/outline';

export default function Header({ toggleMobileMenu }) {
  return (
    // Added "sticky top-0 z-10" to keep the header at the top
    <header className="lg:hidden p-4 bg-gray-100 border-b sticky top-0 z-10">
      <button onClick={toggleMobileMenu}>
        <Bars3Icon className="h-8 w-8 text-gray-700" />
      </button>
    </header>
  );
}
