'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { UserRole, ROLE_PERMISSIONS } from '@/lib/supabase/roles';
import {
  UserPlus,
  ClipboardList,
  BarChart3,
  LogOut,
  HelpCircle,
  X,
} from 'lucide-react';
import { useState } from 'react';

interface MainNavProps {
  user: User;
  role: UserRole | null;
}

const NAV_ITEMS = [
  { path: '/check-in', label: 'Check In', icon: UserPlus, roles: ['admin', 'staff', 'checkin'] },
  { path: '/services', label: 'Services', icon: ClipboardList, roles: ['admin', 'staff'] },
  { path: '/admin', label: 'Dashboard', icon: BarChart3, roles: ['admin', 'board'] },
];

const ROLE_BADGE_COLORS: Record<UserRole, string> = {
  admin: 'bg-emerald-100 text-emerald-700',
  board: 'bg-purple-100 text-purple-700',
  staff: 'bg-blue-100 text-blue-700',
  checkin: 'bg-gray-100 text-gray-700',
};

export function MainNav({ user, role }: MainNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const visibleNavItems = NAV_ITEMS.filter((item) =>
    role ? item.roles.includes(role) : false
  );

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
    router.refresh();
  };

  const userName = user.email?.split('@')[0] || 'User';

  return (
    <>
      {/* Desktop Navigation - Emerald/Green Theme Header */}
      <header className="hidden md:block bg-green-950 text-white sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Top Row - Logo and User Info */}
          <div className="flex justify-between items-center py-3 border-b border-emerald-800/50">
            <div className="flex items-center gap-3">
              {/* Logo */}
              <Link href="/check-in" className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <span className="text-white font-bold text-lg">HC</span>
                </div>
                <div>
                  <h1 className="font-bold text-lg leading-tight">Hope&apos;s Corner</h1>
                  <p className="text-emerald-300 text-xs">Guest Check-In System</p>
                </div>
              </Link>
            </div>

            {/* Right Side - Help, User, Logout */}
            <div className="flex items-center gap-4">
              <button
                className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors"
                title="Help"
              >
                <HelpCircle size={20} />
              </button>
              
              <div className="flex items-center gap-2 text-sm">
                <span className="text-emerald-100">{userName}</span>
                {role && (
                  <span className={`px-2 py-0.5 text-xs rounded-full font-medium capitalize ${ROLE_BADGE_COLORS[role]}`}>
                    {role}
                  </span>
                )}
              </div>
              
              <button
                onClick={handleLogout}
                className="p-2 text-emerald-300 hover:text-white hover:bg-emerald-800/50 rounded-lg transition-colors"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 py-2">
            {visibleNavItems.map((item) => {
              const isActive = pathname.startsWith(item.path);
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`px-5 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all ${
                    isActive
                      ? 'bg-white text-emerald-900 shadow-md'
                      : 'text-emerald-100 hover:bg-emerald-800/60 hover:text-white'
                  }`}
                >
                  <Icon size={18} />
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Mobile Navigation - Bottom tabs with safe area */}
      <nav 
        className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <div className="flex justify-around items-center h-16 px-2">
          {visibleNavItems.map((item) => {
            const isActive = pathname.startsWith(item.path);
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center gap-1 px-4 py-2 rounded-xl transition-colors min-w-[64px] ${
                  isActive
                    ? 'text-emerald-600 bg-emerald-50'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={22} />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>

        {/* Version and Help Link */}
        <div className="flex items-center justify-between px-4 pb-2 text-xs text-gray-400">
          <span>v1.0.0</span>
          <button className="text-emerald-600 hover:text-emerald-700">Need help?</button>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-50" onClick={() => setMobileMenuOpen(false)}>
          <div 
            className="absolute right-0 top-0 bottom-0 w-72 bg-white p-4 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <span className="font-semibold text-gray-900">Menu</span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                <p className="text-sm text-gray-500">Signed in as</p>
                <p className="font-medium text-gray-900 truncate">
                  {user.email}
                </p>
                {role && (
                  <span className={`mt-2 inline-block px-2 py-0.5 text-xs rounded-full font-medium capitalize ${ROLE_BADGE_COLORS[role]}`}>
                    {role}
                  </span>
                )}
              </div>

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-3 p-4 text-red-600 hover:bg-red-50 rounded-xl transition-colors font-medium"
              >
                <LogOut size={20} />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
