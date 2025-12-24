'use client';

import { useMemo } from 'react';
import { Utensils, Truck, Home, Users, Plus, Package, AlertCircle } from 'lucide-react';
import { useMealsStore } from '@/lib/stores/useMealsStore';

interface MealCardProps {
  title: string;
  count: number;
  target?: number;
  icon: React.ReactNode;
  color: string;
}

function MealCard({ title, count, target, icon, color }: MealCardProps) {
  const percentage = target ? Math.min((count / target) * 100, 100) : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <h3 className="font-medium text-gray-700 text-sm">{title}</h3>
        </div>
      </div>
      <div className="text-3xl font-bold text-gray-900">{count}</div>
      {target && (
        <>
          <div className="text-sm text-gray-500 mt-1">Target: {target}</div>
          <div className="mt-2 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentage >= 100 ? 'bg-emerald-500' : 'bg-emerald-400'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          <div className="text-xs text-gray-400 mt-1">{percentage.toFixed(0)}% of target</div>
        </>
      )}
    </div>
  );
}

export function MealOverview() {
  const { 
    getTodayMeals, 
    getTodayRvMeals, 
    getTodayExtraMeals,
    getTodayMealsByType,
  } = useMealsStore();

  const counts = useMemo(() => ({
    guest: getTodayMeals?.()?.reduce((sum: number, m) => sum + m.count, 0) || 0,
    rv: getTodayRvMeals?.()?.reduce((sum: number, m) => sum + m.count, 0) || 0,
    extra: getTodayExtraMeals?.()?.reduce((sum: number, m) => sum + m.count, 0) || 0,
    shelter:
      getTodayMealsByType?.('shelter')?.reduce((sum: number, m) => sum + m.count, 0) || 0,
    unitedEffort:
      getTodayMealsByType?.('united_effort')?.reduce((sum: number, m) => sum + m.count, 0) || 0,
    dayWorker:
      getTodayMealsByType?.('day_worker')?.reduce((sum: number, m) => sum + m.count, 0) || 0,
    lunchBags:
      getTodayMealsByType?.('lunch_bag')?.reduce((sum: number, m) => sum + m.count, 0) || 0,
  }), [getTodayMeals, getTodayRvMeals, getTodayExtraMeals, getTodayMealsByType]);

  const targets = {
    guestMeals: 150,
    rvMeals: 50,
    shelter: 25,
    unitedEffort: 30,
    dayWorker: 35,
  };

  return (
    <div className="space-y-6">
      {/* Today's Meals Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Today&apos;s Meals Overview</h2>
          <p className="text-gray-500 text-sm">
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* Main Meal Cards - Tracked per Guest */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Guest & Distribution</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MealCard
            title="Guest Meals"
            count={counts.guest}
            target={targets.guestMeals}
            icon={<Utensils size={16} className="text-emerald-600" />}
            color="bg-emerald-100"
          />
          <MealCard
            title="RV Meals"
            count={counts.rv}
            target={targets.rvMeals}
            icon={<Truck size={16} className="text-blue-600" />}
            color="bg-blue-100"
          />
          <MealCard
            title="Extra Meals"
            count={counts.extra}
            icon={<Plus size={16} className="text-orange-600" />}
            color="bg-orange-100"
          />
        </div>
      </div>

      {/* Secondary Meal Cards - Placeholders for future types */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Supplementary</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MealCard
            title="Day Worker"
            count={counts.dayWorker}
            target={targets.dayWorker}
            icon={<Users size={16} className="text-amber-600" />}
            color="bg-amber-100"
          />
          <MealCard
            title="Shelter Meals"
            count={counts.shelter}
            target={targets.shelter}
            icon={<Home size={16} className="text-cyan-600" />}
            color="bg-cyan-100"
          />
          <MealCard
            title="United Effort"
            count={counts.unitedEffort}
            target={targets.unitedEffort}
            icon={<Users size={16} className="text-indigo-600" />}
            color="bg-indigo-100"
          />
          <MealCard
            title="Lunch Bags"
            count={counts.lunchBags}
            icon={<Package size={16} className="text-purple-600" />}
            color="bg-purple-100"
          />
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <AlertCircle size={18} className="text-emerald-600 mt-0.5 flex-shrink-0" />
        <div className="text-sm text-emerald-900">
          <p className="font-medium">Guest meals are tracked per person during check-in.</p>
          <p className="text-emerald-800 mt-1">Additional meal types will be enabled in the next update. For detailed per-guest tracking, log from the Check-In tab.</p>
        </div>
      </div>

      {/* Service Status Cards */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3 text-sm uppercase tracking-wide">Service Capacity</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚿</span>
              <span className="font-medium text-gray-700">Showers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">8/8</p>
            <p className="text-xs text-gray-500 mt-1">View on Showers tab</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🧺</span>
              <span className="font-medium text-gray-700">Laundry</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">5/5</p>
            <p className="text-xs text-gray-500 mt-1">View on Laundry tab</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">✂️</span>
              <span className="font-medium text-gray-700">Haircuts</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">Today</p>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="text-2xl">🚴</span>
              <span className="font-medium text-gray-700">Bicycles</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">0</p>
            <p className="text-xs text-gray-500 mt-1">In Progress</p>
          </div>
        </div>
      </div>
    </div>
  );
}
