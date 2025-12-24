'use client';

import { Search } from 'lucide-react';

export function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 text-white shadow-lg">
      <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />

      <div className="relative flex items-center gap-4">
        <div className="w-14 h-14 bg-white/15 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
          <Search size={28} className="text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold">Guest Search &amp; Check-In</h2>
          <p className="text-white/80 mt-1">
            Find existing guests or register new arrivals
          </p>
        </div>
      </div>
    </div>
  );
}
