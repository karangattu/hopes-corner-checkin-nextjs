'use client';

import { Droplets, Shirt, Gift } from 'lucide-react';
import type { UserRole } from '@/lib/supabase/roles';

interface StickyQuickActionsProps {
  role: UserRole | null;
  onShowerAction?: () => void;
  onLaundryAction?: () => void;
  onDonationAction?: () => void;
}

export function StickyQuickActions({ role, onShowerAction, onLaundryAction, onDonationAction }: StickyQuickActionsProps) {
  // Only show for staff and admin
  if (role !== 'admin' && role !== 'staff') {
    return null;
  }

  const actions = [
    {
      id: 'shower',
      icon: Droplets,
      label: 'Shower Booking',
      shortcut: 'Shift+S',
      color: 'bg-blue-600 hover:bg-blue-700',
      handler: onShowerAction,
    },
    {
      id: 'laundry',
      icon: Shirt,
      label: 'Laundry Load',
      shortcut: 'Shift+L',
      color: 'bg-purple-600 hover:bg-purple-700',
      handler: onLaundryAction,
    },
    {
      id: 'donation',
      icon: Gift,
      label: 'Donation Entry',
      shortcut: 'Shift+D',
      color: 'bg-pink-600 hover:bg-pink-700',
      handler: onDonationAction,
    },
  ];

  return (
    <div 
      className="fixed bottom-20 md:bottom-6 left-0 right-0 px-4 z-30"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200 p-2 flex items-center justify-center gap-2">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={action.handler}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-white font-medium transition-all ${action.color}`}
                title={`${action.label} (${action.shortcut})`}
              >
                <Icon size={18} />
                <span className="hidden sm:inline">{action.label}</span>
                <span className="hidden md:inline text-xs opacity-75">
                  {action.shortcut}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
