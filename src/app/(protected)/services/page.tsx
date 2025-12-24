'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Droplets, Shirt, Gift, Bike, Clock, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { MealOverview } from '@/components/services/MealOverview';
import { ShowerSection } from '@/components/services/ShowerSection';
import { LaundrySection } from '@/components/services/LaundrySection';
import { BicycleSection } from '@/components/services/BicycleSection';
import { DonationsSection } from '@/components/services/DonationsSection';
import { TimelineSection } from '@/components/services/TimelineSection';
import { StickyQuickActions } from '@/components/services/StickyQuickActions';
import { useUserRole } from '@/hooks/useUserRole';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

type ServiceTab = 'overview' | 'timeline' | 'showers' | 'laundry' | 'bicycles' | 'donations';

const TABS = [
  { id: 'overview' as const, label: 'Overview', icon: LayoutGrid },
  { id: 'timeline' as const, label: 'Timeline', icon: Clock },
  { id: 'showers' as const, label: 'Showers', icon: Droplets },
  { id: 'laundry' as const, label: 'Laundry', icon: Shirt },
  { id: 'bicycles' as const, label: 'Bicycles', icon: Bike },
  { id: 'donations' as const, label: 'Donations', icon: Gift },
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState<ServiceTab>('overview');
  const { role } = useUserRole();
  const searchParams = useSearchParams();

  useEffect(() => {
    const section = searchParams.get('section') || searchParams.get('tab');
    if (!section) return;
    if (section === 'showers' || section === 'laundry' || section === 'bicycles' || section === 'donations' || section === 'timeline' || section === 'overview') {
      setActiveTab(section);
    }
  }, [searchParams]);

  const allowedTabs = useMemo(() => {
    if (role === 'admin' || role === 'staff') return TABS;
    return [];
  }, [role]);

  useEffect(() => {
    if (allowedTabs.length === 0) return;
    const isActiveAllowed = allowedTabs.some((tab) => tab.id === activeTab);
    if (!isActiveAllowed) {
      setActiveTab(allowedTabs[0].id);
    }
  }, [allowedTabs, activeTab]);

  const handleQuickAction = useCallback((tabId: ServiceTab) => {
    setActiveTab(tabId);
  }, []);

  const enableShortcuts = role === 'admin' || role === 'staff';
  useKeyboardShortcuts(
    enableShortcuts
      ? [
          { key: 's', shift: true, action: () => handleQuickAction('showers') },
          { key: 'l', shift: true, action: () => handleQuickAction('laundry') },
          { key: 'd', shift: true, action: () => handleQuickAction('donations') },
        ]
      : []
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <MealOverview />;
      case 'timeline':
        return <TimelineSection />;
      case 'showers':
        return <ShowerSection />;
      case 'laundry':
        return <LaundrySection />;
      case 'bicycles':
        return <BicycleSection />;
      case 'donations':
        return <DonationsSection />;
      default:
        return <MealOverview />;
    }
  };

  if (allowedTabs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center space-y-3">
          <p className="text-lg font-semibold text-gray-900">Services are limited to staff and admins.</p>
          <p className="text-sm text-gray-500">Switch to the Check-In tab or contact an administrator if you need additional access.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-32">
      {/* Tab Navigation */}
      <div className="mb-6 overflow-x-auto">
        <div className="flex gap-1 p-1 bg-gray-100 rounded-xl min-w-max">
          {allowedTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium text-sm transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon size={18} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="min-h-[60vh]">
        {renderContent()}
      </div>

      {/* Sticky Quick Actions */}
      <StickyQuickActions
        role={role}
        onShowerAction={() => handleQuickAction('showers')}
        onLaundryAction={() => handleQuickAction('laundry')}
        onDonationAction={() => handleQuickAction('donations')}
      />
    </div>
  );
}
