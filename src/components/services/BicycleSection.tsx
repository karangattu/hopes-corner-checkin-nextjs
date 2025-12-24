'use client';

import { useMemo } from 'react';
import { Bike, Plus, Wrench, CheckCircle, Clock } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/useServicesStore';
import { useGuestsStore } from '@/lib/stores/useGuestsStore';
import type { BicycleRepairStatus } from '@/lib/types';

const STATUS_SECTIONS = [
  { id: 'pending' as const, label: 'Pending', icon: Clock, color: 'text-amber-600', bgColor: 'bg-amber-50' },
  { id: 'in_progress' as const, label: 'In Progress', icon: Wrench, color: 'text-blue-600', bgColor: 'bg-blue-50' },
  { id: 'done' as const, label: 'Completed', icon: CheckCircle, color: 'text-emerald-600', bgColor: 'bg-emerald-50' },
];

export function BicycleSection() {
  const { getTodayBicycles } = useServicesStore();
  const { guests } = useGuestsStore();

  const bicycleRecords = useMemo(() => getTodayBicycles?.() || [], [getTodayBicycles]);

  const getGuestName = (guestId: string | null): string => {
    if (!guestId) return 'Unknown';
    const guest = guests.find((g) => g.id === guestId);
    return guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown';
  };

  const getRecordsByStatus = (status: BicycleRepairStatus) => {
    return bicycleRecords.filter((r) => r.status === status);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
            <Bike className="text-orange-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Bicycle Repairs</h2>
            <p className="text-gray-500 text-sm">Today&apos;s repair queue</p>
          </div>
        </div>
        <button className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center gap-2">
          <Plus size={18} />
          Add Repair
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        {STATUS_SECTIONS.map((section) => {
          const count = getRecordsByStatus(section.id).length;
          const Icon = section.icon;
          return (
            <div key={section.id} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center gap-2 mb-2">
                <Icon size={18} className={section.color} />
                <span className="text-sm text-gray-500">{section.label}</span>
              </div>
              <div className="text-2xl font-bold text-gray-900">{count}</div>
            </div>
          );
        })}
      </div>

      {/* Repair Sections */}
      {STATUS_SECTIONS.map((section) => {
        const records = getRecordsByStatus(section.id);
        const Icon = section.icon;

        if (records.length === 0 && section.id !== 'pending') return null;

        return (
          <div
            key={section.id}
            className={`rounded-xl border border-gray-200 overflow-hidden ${section.bgColor}`}
          >
            <div className="p-4 border-b border-gray-100 bg-white/50">
              <div className="flex items-center gap-2">
                <Icon size={18} className={section.color} />
                <h3 className="font-semibold text-gray-900">{section.label}</h3>
                <span className="text-sm text-gray-500">({records.length})</span>
              </div>
            </div>
            <div className="p-4 space-y-3">
              {records.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No {section.label.toLowerCase()} repairs
                </div>
              ) : (
                records.map((record) => (
                  <div
                    key={record.id}
                    className="bg-white rounded-lg p-4 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {getGuestName(record.guestId)}
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {record.repairTypes?.map((type, idx) => (
                            <span
                              key={idx}
                              className={`px-2 py-0.5 text-xs rounded-full ${
                                type === 'New Bicycle'
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {type}
                            </span>
                          ))}
                        </div>
                        {record.notes && (
                          <p className="mt-2 text-sm text-gray-500">{record.notes}</p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        {section.id === 'pending' && (
                          <button className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                            Start Repair
                          </button>
                        )}
                        {section.id === 'in_progress' && (
                          <button className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
