'use client';

import { useMemo } from 'react';
import { Clock, Droplets, Shirt, Utensils, Bike, Gift, Scissors } from 'lucide-react';
import { useMealsStore } from '@/lib/stores/useMealsStore';
import { useServicesStore } from '@/lib/stores/useServicesStore';
import { useGuestsStore } from '@/lib/stores/useGuestsStore';

interface TimelineEvent {
  id: string;
  type: 'meal' | 'shower' | 'laundry' | 'bicycle' | 'donation' | 'haircut';
  guestName: string;
  description: string;
  time: string;
  timestamp: Date;
}

const TYPE_CONFIG = {
  meal: { icon: Utensils, color: 'bg-emerald-100 text-emerald-600' },
  shower: { icon: Droplets, color: 'bg-blue-100 text-blue-600' },
  laundry: { icon: Shirt, color: 'bg-purple-100 text-purple-600' },
  bicycle: { icon: Bike, color: 'bg-orange-100 text-orange-600' },
  donation: { icon: Gift, color: 'bg-pink-100 text-pink-600' },
  haircut: { icon: Scissors, color: 'bg-amber-100 text-amber-600' },
};

export function TimelineSection() {
  const { getTodayMeals, getTodayHaircuts } = useMealsStore();
  const { getTodayShowers, getTodayLaundry, getTodayBicycles } = useServicesStore();
  const { guests } = useGuestsStore();

  const events: TimelineEvent[] = useMemo(() => {
    const allEvents: TimelineEvent[] = [];

    const lookupGuest = (guestId: string | null): string => {
      if (!guestId) return 'Guest';
      const guest = guests.find((g) => g.id === guestId);
      return guest ? `${guest.firstName} ${guest.lastName}` : 'Guest';
    };

    // Add meals
    const meals = getTodayMeals?.() || [];
    meals.forEach((meal) => {
      allEvents.push({
        id: `meal-${meal.id}`,
        type: 'meal',
        guestName: lookupGuest(meal.guestId),
        description: `${meal.count} meal(s) served`,
        time: new Date(meal.recordedAt).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        timestamp: new Date(meal.recordedAt),
      });
    });

    // Add showers
    const showers = getTodayShowers?.() || [];
    showers.forEach((shower) => {
      allEvents.push({
        id: `shower-${shower.id}`,
        type: 'shower',
        guestName: lookupGuest(shower.guestId),
        description: `Shower ${shower.status}`,
        time: shower.time || 'Unscheduled',
        timestamp: new Date(shower.createdAt),
      });
    });

    // Add laundry
    const laundry = getTodayLaundry?.() || [];
    laundry.forEach((record) => {
      allEvents.push({
        id: `laundry-${record.id}`,
        type: 'laundry',
        guestName: lookupGuest(record.guestId),
        description: `Laundry ${record.status} (${record.laundryType})`,
        time: record.time || 'Unscheduled',
        timestamp: new Date(record.createdAt),
      });
    });

    // Add bicycles
    const bicycles = getTodayBicycles?.() || [];
    bicycles.forEach((repair) => {
      allEvents.push({
        id: `bicycle-${repair.id}`,
        type: 'bicycle',
        guestName: lookupGuest(repair.guestId),
        description: `Bicycle repair: ${repair.repairTypes.slice(0, 2).join(', ')}${repair.repairTypes.length > 2 ? '...' : ''}`,
        time: new Date(repair.lastUpdated).toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
        timestamp: new Date(repair.lastUpdated),
      });
    });

    // Add haircuts
    const haircuts = getTodayHaircuts?.() || [];
    haircuts.forEach((haircut) => {
      allEvents.push({
        id: `haircut-${haircut.id}`,
        type: 'haircut',
        guestName: lookupGuest(haircut.guestId),
        description: 'Haircut completed',
        time: 'Today',
        timestamp: new Date(haircut.date),
      });
    });

    // Sort by timestamp (newest first)
    return allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [getTodayMeals, getTodayShowers, getTodayLaundry, getTodayBicycles, getTodayHaircuts, guests]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
            <Clock className="text-gray-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Activity Timeline</h2>
            <p className="text-gray-500 text-sm">Real-time view of all service activities</p>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          {events.length} events today
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(TYPE_CONFIG).map(([type, config]) => {
          const Icon = config.icon;
          return (
            <button
              key={type}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${config.color}`}
            >
              <Icon size={16} />
              {type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          );
        })}
      </div>

      {/* Timeline */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {events.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Clock size={48} className="mx-auto mb-4 opacity-50" />
            <p>No service activity recorded today</p>
            <p className="text-sm mt-1">Events will appear here as they are created</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {events.map((event) => {
              const config = TYPE_CONFIG[event.type];
              const Icon = config.icon;
              return (
                <div key={event.id} className="p-4 flex items-start gap-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${config.color}`}>
                    <Icon size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-medium text-gray-900">{event.guestName}</h4>
                      <span className="text-sm text-gray-500 flex-shrink-0">{event.time}</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
