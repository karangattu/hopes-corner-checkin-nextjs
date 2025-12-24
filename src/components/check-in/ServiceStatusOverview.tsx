'use client';

import { Droplets, Shirt } from 'lucide-react';
import Link from 'next/link';

interface ShowerStats {
  available: number;
  total: number;
  waitlistCount: number;
}

interface LaundryStats {
  available: number;
  total: number;
}

interface ServiceStatusOverviewProps {
  showerStats: ShowerStats;
  laundryStats: LaundryStats;
  canNavigate?: boolean;
}

function ShowerCard({ stats }: { stats: ShowerStats }) {
  const showersOpen = stats.available > 0;
  const primaryNumber = showersOpen ? stats.available : stats.waitlistCount;
  const primaryLabel = showersOpen ? 'Available' : 'Waitlist';

  return (
    <div
      className={`p-4 rounded-xl border transition-all ${
        showersOpen
          ? 'bg-white border-gray-200 hover:border-gray-300'
          : 'bg-white border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Droplets size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">Showers</h3>
            </div>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mt-1">{primaryLabel}</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
              showersOpen
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {showersOpen ? 'OPEN' : 'FULL'}
          </span>
          <div className="text-2xl font-bold text-blue-700 tabular-nums leading-none">
            {primaryNumber}
          </div>
        </div>
      </div>
    </div>
  );
}

function LaundryCard({ stats }: { stats: LaundryStats }) {
  const laundryOpen = stats.available > 0;

  return (
    <div className="p-4 rounded-xl border border-gray-200 bg-white hover:border-gray-300 transition-all">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <Shirt size={18} />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Laundry</h3>
            <p className="text-[11px] uppercase tracking-wide text-gray-400 mt-1">Available</p>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span
            className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full ${
              laundryOpen
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-red-100 text-red-700'
            }`}
          >
            {laundryOpen ? 'OPEN' : 'FULL'}
          </span>
          <div className="text-2xl font-bold text-purple-700 tabular-nums leading-none">
            {stats.available}
          </div>
        </div>
      </div>
    </div>
  );
}

export function ServiceStatusOverview({
  showerStats,
  laundryStats,
  canNavigate = true,
}: ServiceStatusOverviewProps) {
  if (canNavigate) {
    return (
      <div className="grid grid-cols-2 gap-4">
        <Link href="/services?section=showers">
          <ShowerCard stats={showerStats} />
        </Link>
        <Link href="/services?section=laundry">
          <LaundryCard stats={laundryStats} />
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4">
      <ShowerCard stats={showerStats} />
      <LaundryCard stats={laundryStats} />
    </div>
  );
}
