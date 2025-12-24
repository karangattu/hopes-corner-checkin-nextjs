'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { BicycleKanban } from '@/components/lanes';
import { useServicesStore } from '@/lib/stores/useServicesStore';
import { useGuestsStore } from '@/lib/stores/useGuestsStore';
import { useEffect, useCallback } from 'react';
import type { BicycleRepairStatus } from '@/lib/types';

export default function BicycleKanbanPage() {
  const { bicycleRecords, updateBicycleRecord, deleteBicycleRecord } = useServicesStore();
  const { guests, fetchGuests } = useGuestsStore();

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  const setBicycleStatus = useCallback(
    async (recordId: string, status: BicycleRepairStatus) => {
      await updateBicycleRecord(recordId, { status });
    },
    [updateBicycleRecord]
  );

  return (
    <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/services"
          className="flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors mb-2"
        >
          <ArrowLeft size={20} />
          Back to Services
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">Bicycle Repair Management</h1>
        <p className="text-gray-500 mt-1">
          Track and manage bicycle repairs with drag-and-drop kanban board
        </p>
      </div>

      {/* Kanban Board */}
      <BicycleKanban
        bicycleRecords={bicycleRecords}
        guests={guests}
        updateBicycleRecord={updateBicycleRecord}
        deleteBicycleRecord={deleteBicycleRecord}
        setBicycleStatus={setBicycleStatus}
      />
    </div>
  );
}
