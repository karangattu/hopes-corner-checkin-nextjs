'use client';

import { useState, useMemo } from 'react';
import { Gift, Plus, ChevronLeft, ChevronRight, Scale, FileText, BarChart3 } from 'lucide-react';
import { useDonationsStore } from '@/lib/stores/useDonationsStore';
import { DONATION_TYPES } from '@/lib/constants';
import type { Donation } from '@/lib/types';

const DENSITY_OPTIONS = [
  { value: 'light', label: 'Light', servingsPerLb: 2 },
  { value: 'medium', label: 'Medium', servingsPerLb: 3 },
  { value: 'heavy', label: 'Heavy', servingsPerLb: 4 },
];

export function DonationsSection() {
  const { donationRecords } = useDonationsStore();
  const [activeSubTab, setActiveSubTab] = useState<'log' | 'analytics' | 'export'>('log');
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Form state
  const [formData, setFormData] = useState({
    type: DONATION_TYPES[0],
    itemName: '',
    trays: '',
    weightLbs: '',
    density: 'medium',
    donor: '',
  });

  // Filter donations by selected date
  const todayDonations = useMemo(() => {
    const dateStr = selectedDate.toISOString().split('T')[0];
    return donationRecords?.filter((d: Donation) => d.dateKey === dateStr) || [];
  }, [donationRecords, selectedDate]);

  // Calculate totals
  const totals = useMemo(() => {
    return todayDonations.reduce(
      (acc: { entries: number; trays: number; weight: number; donors: Set<string> }, d: Donation) => ({
        entries: acc.entries + 1,
        trays: acc.trays + (d.trays || 0),
        weight: acc.weight + (d.weightLbs || 0),
        donors: acc.donors.add(d.donor || 'Unknown'),
      }),
      { entries: 0, trays: 0, weight: 0, donors: new Set<string>() }
    );
  }, [todayDonations]);

  const navigateDate = (delta: number) => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + delta);
    setSelectedDate(newDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Add donation via store
    console.log('Submit donation:', formData);
    // Reset form
    setFormData({
      type: DONATION_TYPES[0],
      itemName: '',
      trays: '',
      weightLbs: '',
      density: 'medium',
      donor: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-pink-100 rounded-xl flex items-center justify-center">
            <Gift className="text-pink-600" size={20} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">Donations</h2>
            <p className="text-gray-500 text-sm">Track food donations received</p>
          </div>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[
          { id: 'log' as const, label: 'Log', icon: FileText },
          { id: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
          { id: 'export' as const, label: 'Export', icon: Scale },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 ${
                activeSubTab === tab.id
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Date Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => navigateDate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronLeft size={20} />
        </button>
        <span className="font-medium text-gray-900">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
        <button
          onClick={() => navigateDate(1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Entries</div>
          <div className="text-2xl font-bold text-gray-900">{totals.entries}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Trays</div>
          <div className="text-2xl font-bold text-gray-900">{totals.trays}</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Weight</div>
          <div className="text-2xl font-bold text-gray-900">{totals.weight} lbs</div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <div className="text-sm text-gray-500">Donors</div>
          <div className="text-2xl font-bold text-gray-900">{totals.donors.size}</div>
        </div>
      </div>

      {activeSubTab === 'log' && (
        <>
          {/* New Donation Form */}
          <div className="bg-white rounded-xl border border-gray-200 p-4">
            <h3 className="font-semibold text-gray-900 mb-4">New Donation</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Type</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as typeof formData.type })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {DONATION_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Item</label>
                  <input
                    type="text"
                    value={formData.itemName}
                    onChange={(e) => setFormData({ ...formData, itemName: e.target.value })}
                    placeholder="e.g., Chicken Breast"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Trays</label>
                  <input
                    type="number"
                    value={formData.trays}
                    onChange={(e) => setFormData({ ...formData, trays: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Weight (lbs)</label>
                  <input
                    type="number"
                    value={formData.weightLbs}
                    onChange={(e) => setFormData({ ...formData, weightLbs: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Density</label>
                  <select
                    value={formData.density}
                    onChange={(e) => setFormData({ ...formData, density: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  >
                    {DENSITY_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 mb-1">Donor</label>
                  <input
                    type="text"
                    value={formData.donor}
                    onChange={(e) => setFormData({ ...formData, donor: e.target.value })}
                    placeholder="e.g., Safeway"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <Plus size={18} />
                    Add Donation
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* Today's Donations List */}
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h3 className="font-semibold text-gray-900">Today&apos;s Donations</h3>
            </div>
            {todayDonations.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No donations logged for this date
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {todayDonations.map((donation: Donation) => (
                  <div key={donation.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 text-xs rounded-full bg-pink-100 text-pink-700">
                          {donation.type}
                        </span>
                        <span className="font-medium text-gray-900">{donation.itemName}</span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        {donation.trays} trays, {donation.weightLbs} lbs - {donation.donor}
                      </p>
                    </div>
                    <div className="text-sm text-gray-500">
                      ~{donation.servings} servings
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {activeSubTab === 'analytics' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <BarChart3 size={48} className="mx-auto mb-4 opacity-50" />
          <p>Donation analytics coming soon</p>
        </div>
      )}

      {activeSubTab === 'export' && (
        <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-500">
          <Scale size={48} className="mx-auto mb-4 opacity-50" />
          <p>Export functionality coming soon</p>
        </div>
      )}
    </div>
  );
}
