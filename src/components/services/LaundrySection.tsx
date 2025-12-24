'use client';

import { useMemo, useState } from 'react';
import { Shirt, UserPlus, GripVertical, Package } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/useServicesStore';
import { useGuestsStore } from '@/lib/stores/useGuestsStore';
import type { LaundryRecord, LaundryStatus } from '@/lib/types';

const ONSITE_COLUMNS = [
  { id: 'waiting' as const, label: 'Waiting', color: 'bg-gray-100' },
  { id: 'washer' as const, label: 'Washer', color: 'bg-blue-100' },
  { id: 'dryer' as const, label: 'Dryer', color: 'bg-amber-100' },
  { id: 'done' as const, label: 'Done', color: 'bg-emerald-100' },
  { id: 'picked_up' as const, label: 'Picked Up', color: 'bg-purple-100' },
];

const OFFSITE_COLUMNS = [
  { id: 'pending' as const, label: 'Pending', color: 'bg-gray-100' },
  { id: 'transported' as const, label: 'Transported', color: 'bg-blue-100' },
  { id: 'returned' as const, label: 'Returned', color: 'bg-amber-100' },
  { id: 'offsite_picked_up' as const, label: 'Picked Up', color: 'bg-emerald-100' },
];

export function LaundrySection() {
  const { getTodayOnsiteLaundry, getTodayOffsiteLaundry } = useServicesStore();
  const { guests } = useGuestsStore();
  const [activeTab, setActiveTab] = useState<'onsite' | 'offsite'>('onsite');

  const onsiteLaundry = useMemo(() => getTodayOnsiteLaundry?.() || [], [getTodayOnsiteLaundry]);
  const offsiteLaundry = useMemo(() => getTodayOffsiteLaundry?.() || [], [getTodayOffsiteLaundry]);

  const getGuestName = (guestId: string): string => {
    const guest = guests.find((g) => g.id === guestId);
    return guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown';
  };

  const getRecordsByStatus = (records: LaundryRecord[], status: LaundryStatus) => {
    return records.filter((r) => r.status === status);
  };

  const columns = activeTab === 'onsite' ? ONSITE_COLUMNS : OFFSITE_COLUMNS;
  const records = activeTab === 'onsite' ? onsiteLaundry : offsiteLaundry;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shirt className="text-purple-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Laundry Management</h2>
            <p className="text-gray-500 text-sm">Kanban board for tracking laundry</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2">
          <UserPlus size={18} />
          Add Guest
        </button>
      </div>

      {/* Tab Toggle */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('onsite')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'onsite'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          On-site ({onsiteLaundry.length})
        </button>
        <button
          onClick={() => setActiveTab('offsite')}
          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === 'offsite'
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Off-site ({offsiteLaundry.length})
        </button>
      </div>

      {/* Kanban Board */}
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-max pb-4">
          {columns.map((column) => {
            const columnRecords = getRecordsByStatus(records, column.id);
            return (
              <div
                key={column.id}
                className={`w-56 flex-shrink-0 rounded-xl ${column.color} overflow-hidden`}
              >
                <div className="p-3 border-b border-white/50">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">{column.label}</h3>
                    <span className="text-sm text-gray-600">({columnRecords.length})</span>
                  </div>
                </div>
                <div className="p-2 space-y-2 min-h-[200px]">
                  {columnRecords.map((record) => (
                    <div
                      key={record.id}
                      className="bg-white rounded-lg p-3 shadow-sm border border-gray-100 cursor-grab active:cursor-grabbing"
                    >
                      <div className="flex items-start gap-2">
                        <GripVertical size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {getGuestName(record.guestId)}
                          </p>
                          {record.bagNumber && (
                            <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                              <Package size={14} />
                              Bag #{record.bagNumber}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {columnRecords.length === 0 && (
                    <div className="text-center text-gray-400 text-sm py-8">
                      No items
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
