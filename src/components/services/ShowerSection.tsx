'use client';

import { useMemo, useState } from 'react';
import { Droplets, UserPlus, Check, Clock } from 'lucide-react';
import { useServicesStore } from '@/lib/stores/useServicesStore';
import { useGuestsStore } from '@/lib/stores/useGuestsStore';
import type { ShowerRecord, ShowerStatus } from '@/lib/types';

interface TimeSlot {
  time: string;
  slots: (ShowerRecord | null)[];
  available: number;
}

const SHOWER_SLOTS_PER_TIME = 2;
const TIME_SLOTS = [
  '08:00', '08:15', '08:30', '08:45',
  '09:00', '09:15', '09:30', '09:45',
  '10:00', '10:15', '10:30', '10:45',
  '11:00', '11:15', '11:30', '11:45',
];

function getStatusColor(status: ShowerStatus): string {
  switch (status) {
    case 'booked':
      return 'bg-blue-100 text-blue-700';
    case 'done':
      return 'bg-emerald-100 text-emerald-700';
    case 'waitlisted':
      return 'bg-purple-100 text-purple-700';
    case 'no_show':
      return 'bg-gray-100 text-gray-700';
    case 'cancelled':
      return 'bg-red-100 text-red-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
}

export function ShowerSection() {
  const { getTodayShowers, updateShowerStatus } = useServicesStore();
  const { guests } = useGuestsStore();
  const [, setShowBookingModal] = useState(false);

  const showerRecords = useMemo(() => getTodayShowers?.() || [], [getTodayShowers]);

  // Organize records by time slot
  const timeSlots: TimeSlot[] = useMemo(() => {
    return TIME_SLOTS.map((time) => {
      const slotsForTime = showerRecords.filter((r) => r.time === time);
      const slots: (ShowerRecord | null)[] = [];
      for (let i = 0; i < SHOWER_SLOTS_PER_TIME; i++) {
        slots.push(slotsForTime[i] || null);
      }
      return {
        time,
        slots,
        available: SHOWER_SLOTS_PER_TIME - slotsForTime.length,
      };
    });
  }, [showerRecords]);

  const waitlist = useMemo(
    () => showerRecords.filter((r) => r.status === 'waitlisted'),
    [showerRecords]
  );

  const completedCount = useMemo(
    () => showerRecords.filter((r) => r.status === 'done').length,
    [showerRecords]
  );

  const getGuestName = (guestId: string): string => {
    const guest = guests.find((g) => g.id === guestId);
    return guest ? `${guest.firstName} ${guest.lastName}` : 'Unknown Guest';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
            <Droplets className="text-blue-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Shower Schedule</h2>
            <p className="text-gray-500 text-sm">Today&apos;s bookings and availability</p>
          </div>
        </div>
        <button
          onClick={() => setShowBookingModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <UserPlus size={18} />
          Add Guest
        </button>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Total Slots</div>
          <div className="text-2xl font-bold text-gray-900">
            {TIME_SLOTS.length * SHOWER_SLOTS_PER_TIME}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Completed</div>
          <div className="text-2xl font-bold text-emerald-600">{completedCount}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Waitlist</div>
          <div className="text-2xl font-bold text-amber-600">{waitlist.length}</div>
        </div>
      </div>

      {/* Time Slots Grid */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Time Slots</h3>
        </div>
        <div className="divide-y divide-gray-100">
          {timeSlots.map((slot) => (
            <div key={slot.time} className="p-4 flex items-center gap-4">
              <div className="w-16 font-mono text-sm text-gray-600">{slot.time}</div>
              <div className="flex-1 flex gap-2">
                {slot.slots.map((record, idx) => (
                  <div
                    key={idx}
                    className={`flex-1 px-3 py-2 rounded-lg border ${
                      record
                        ? `${getStatusColor(record.status)} border-transparent`
                        : 'border-dashed border-gray-300 text-gray-400'
                    }`}
                  >
                    {record ? getGuestName(record.guestId) : 'Available'}
                  </div>
                ))}
              </div>
              <div className="text-sm">
                {slot.available > 0 ? (
                  <span className="text-emerald-600 font-medium">
                    {slot.available} open
                  </span>
                ) : (
                  <span className="text-red-600 font-medium">Full</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Waitlist Section */}
      {waitlist.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100 flex items-center gap-2">
            <Clock size={18} className="text-purple-600" />
            <h3 className="font-semibold text-gray-900">Waitlist ({waitlist.length})</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {waitlist.map((record, idx) => (
              <div key={record.id} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-medium text-sm">
                    {idx + 1}
                  </div>
                  <span className="font-medium text-gray-900">{getGuestName(record.guestId)}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => updateShowerStatus?.(record.id, 'booked')}
                    className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors"
                  >
                    Promote
                  </button>
                  <button
                    onClick={() => updateShowerStatus?.(record.id, 'cancelled')}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed Today */}
      <div className="text-center text-gray-500">
        <Check size={18} className="inline mr-2 text-emerald-600" />
        Completed today: {completedCount} showers
      </div>
    </div>
  );
}
