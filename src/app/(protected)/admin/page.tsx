'use client';

import { useState, useMemo } from 'react';
import {
  LayoutDashboard,
  Download,
  UserPlus,
  CalendarCheck,
  BarChart3,
  Utensils,
  ShowerHead,
  WashingMachine,
  Bike,
  Gift,
  FileDown,
  Calendar,
  Users,
  FileText,
  Package,
  User,
} from 'lucide-react';
import { useMealsStore, useServicesStore, useDonationsStore, useGuestsStore } from '@/lib/stores';
import { GuestBatchUpload } from '@/components/guest';
import AttendanceBatchUpload from '@/components/admin/AttendanceBatchUpload';
import MonthlySummaryReport from '@/components/admin/MonthlySummaryReport';

type AdminTab = 'overview' | 'exports' | 'guests' | 'attendance' | 'analytics';

interface TabItem {
  id: AdminTab;
  label: string;
  icon: React.ReactNode;
}

const TABS: TabItem[] = [
  { id: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> },
  { id: 'exports', label: 'Data Exports', icon: <Download size={18} /> },
  { id: 'guests', label: 'Guest Upload', icon: <UserPlus size={18} /> },
  { id: 'attendance', label: 'Attendance', icon: <CalendarCheck size={18} /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 size={18} /> },
];

// Progress bar component
function ProgressBar({ current, target, color = 'emerald' }: { current: number; target: number; color?: string }) {
  const percentage = target > 0 ? Math.min((current / target) * 100, 100) : 0;
  return (
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className={`h-2 rounded-full bg-${color}-500`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}

// Metric card component
function MetricCardLocal({
  icon,
  label,
  current,
  target,
  color = 'emerald',
}: {
  icon: React.ReactNode;
  label: string;
  current: number;
  target?: number;
  color?: string;
}) {
  const percentage = target && target > 0 ? Math.round((current / target) * 100) : null;
  const colorClasses: Record<string, string> = {
    emerald: 'bg-emerald-100 text-emerald-600',
    cyan: 'bg-cyan-100 text-cyan-600',
    purple: 'bg-purple-100 text-purple-600',
    orange: 'bg-orange-100 text-orange-600',
    pink: 'bg-pink-100 text-pink-600',
    blue: 'bg-blue-100 text-blue-600',
    amber: 'bg-amber-100 text-amber-600',
  };
  
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 ${colorClasses[color] || colorClasses.emerald} rounded-lg flex items-center justify-center`}>
          {icon}
        </div>
        <span className="text-sm font-medium text-gray-600">{label}</span>
      </div>
      <div className="space-y-2">
        <div className="flex items-baseline gap-1">
          <span className="text-2xl font-bold text-gray-900">{current}</span>
          {target && <span className="text-gray-400">/ {target}</span>}
        </div>
        {target && (
          <>
            <ProgressBar current={current} target={target} color={color} />
            <p className="text-xs text-gray-500">{percentage}% of target</p>
          </>
        )}
      </div>
    </div>
  );
}

// Overview section
function OverviewSection() {
  const { getTodayMeals } = useMealsStore();
  const { getTodayShowers, getTodayLaundry, getTodayBicycles } = useServicesStore();
  const { getTodayDonations } = useDonationsStore();
  const { guests } = useGuestsStore();

  const stats = useMemo(() => {
    const todayMeals = getTodayMeals();
    const todayShowers = getTodayShowers();
    const todayLaundry = getTodayLaundry();
    const todayBicycles = getTodayBicycles();
    const todayDonations = getTodayDonations();

    // Calculate totals
    const guestMeals = todayMeals.filter(m => m.type === 'guest').reduce((sum, m) => sum + m.count, 0);
    const rvMeals = todayMeals.filter(m => m.type === 'rv').reduce((sum, m) => sum + m.count, 0);
    const shelterMeals = todayMeals.filter(m => m.type === 'extra').reduce((sum, m) => sum + m.count, 0);
    const showersCompleted = todayShowers.filter(s => s.status === 'done').length;
    const laundryCompleted = todayLaundry.filter(l => l.status === 'done').length;
    const bicyclesInProgress = todayBicycles.filter(b => b.status === 'in_progress').length;
    const totalDonationWeight = todayDonations.reduce((sum, d) => sum + d.weightLbs, 0);

    return {
      guestMeals,
      rvMeals,
      shelterMeals,
      showersCompleted,
      showersTotal: todayShowers.length,
      laundryCompleted,
      laundryTotal: todayLaundry.length,
      bicyclesInProgress,
      totalDonationWeight,
      totalGuests: guests.length,
    };
  }, [getTodayMeals, getTodayShowers, getTodayLaundry, getTodayBicycles, getTodayDonations, guests]);

  // Default targets
  const targets = {
    guestMeals: 150,
    rvMeals: 50,
    shelterMeals: 25,
    showers: 16,
    laundry: 10,
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Today&apos;s Progress</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCardLocal
            icon={<Utensils size={20} />}
            label="Guest Meals"
            current={stats.guestMeals}
            target={targets.guestMeals}
            color="emerald"
          />
          <MetricCardLocal
            icon={<Utensils size={20} />}
            label="RV Deliveries"
            current={stats.rvMeals}
            target={targets.rvMeals}
            color="blue"
          />
          <MetricCardLocal
            icon={<Utensils size={20} />}
            label="Shelter Meals"
            current={stats.shelterMeals}
            target={targets.shelterMeals}
            color="purple"
          />
          <MetricCardLocal
            icon={<WashingMachine size={20} />}
            label="Laundry Loads"
            current={stats.laundryCompleted}
            target={targets.laundry}
            color="orange"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCardLocal
          icon={<ShowerHead size={20} />}
          label="Showers"
          current={stats.showersCompleted}
          target={targets.showers}
          color="cyan"
        />
        <MetricCardLocal
          icon={<Bike size={20} />}
          label="Bike Services"
          current={stats.bicyclesInProgress}
          color="pink"
        />
        <MetricCardLocal
          icon={<Gift size={20} />}
          label="Donations"
          current={stats.totalDonationWeight}
          color="amber"
        />
        <MetricCardLocal
          icon={<Users size={20} />}
          label="Total Guests"
          current={stats.totalGuests}
          color="blue"
        />
      </div>
    </div>
  );
}

// Data exports section
function ExportsSection() {
  const [dateRange, setDateRange] = useState({
    start: new Date().toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [exportType, setExportType] = useState<string>('services');
  const [isExporting, setIsExporting] = useState(false);

  const exportOptions = [
    { id: 'services', label: 'Services (showers, laundry, meals, etc.)', icon: <FileText size={16} /> },
    { id: 'metrics', label: 'Metrics (daily summaries)', icon: <BarChart3 size={16} /> },
    { id: 'donations', label: 'Donations (food donations received)', icon: <Gift size={16} /> },
    { id: 'supplies', label: 'Supplies (inventory items)', icon: <Package size={16} /> },
    { id: 'guest-timeline', label: 'Single Guest Timeline', icon: <User size={16} /> },
  ];

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Determine the API endpoint based on export type
      let endpoint = '/api/export/';
      const params = new URLSearchParams({
        startDate: dateRange.start,
        endDate: dateRange.end,
      });

      switch (exportType) {
        case 'services':
          endpoint += `attendance?${params.toString()}`;
          break;
        case 'donations':
          endpoint += `donations?${params.toString()}`;
          break;
        case 'guests':
          endpoint += 'guests';
          break;
        default:
          endpoint += `attendance?${params.toString()}`;
      }

      const response = await fetch(endpoint);
      if (!response.ok) throw new Error('Export failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${exportType}-export-${dateRange.start}-to-${dateRange.end}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h2>
      
      {/* Date Range */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <span className="text-gray-500">to</span>
          <div className="relative flex-1">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Export Type Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Export Type</label>
        <div className="space-y-2">
          {exportOptions.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                exportType === option.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="exportType"
                value={option.id}
                checked={exportType === option.id}
                onChange={(e) => setExportType(e.target.value)}
                className="text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-gray-500">{option.icon}</span>
              <span className="text-gray-700">{option.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        <FileDown size={20} />
        {isExporting ? 'Exporting...' : 'Download CSV'}
      </button>
    </div>
  );
}

// Guest upload section
function GuestUploadSection() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Guest Batch Upload</h2>
      <p className="text-gray-500 mb-4">
        Import multiple guests from a CSV file. Required columns: firstName, lastName, housingStatus, age, gender.
        Optional columns: preferredName, notes, bicycleDescription, city.
      </p>
      <GuestBatchUpload />
    </div>
  );
}

// Attendance section
function AttendanceSection() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Attendance Batch Upload</h2>
      <p className="text-gray-500 mb-4">
        Import historical attendance records from a CSV file. Supports meals, showers, laundry, and other service types.
      </p>
      <AttendanceBatchUpload />
    </div>
  );
}

// Analytics section
function AnalyticsSection() {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Monthly Summary Report</h2>
        <p className="text-gray-500 mb-4">
          Month-by-month breakdown of all service metrics including meals, showers, laundry, and more.
        </p>
        <MonthlySummaryReport />
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewSection />;
      case 'exports':
        return <ExportsSection />;
      case 'guests':
        return <GuestUploadSection />;
      case 'attendance':
        return <AttendanceSection />;
      case 'analytics':
        return <AnalyticsSection />;
      default:
        return <OverviewSection />;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-500 mt-1">{today}</p>
      </div>

      {/* Section Tabs */}
      <div className="mb-6 border-b border-gray-200">
        <nav className="flex gap-1 overflow-x-auto pb-px -mb-px scrollbar-hide">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-600 text-emerald-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      {renderContent()}
    </div>
  );
}
