'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useGuestsStore } from '@/lib/stores/useGuestsStore';
import { useMealsStore } from '@/lib/stores/useMealsStore';
import { useServicesStore } from '@/lib/stores/useServicesStore';
import { WelcomeBanner, ServiceStatusOverview } from '@/components/check-in';
import { GuestList } from '@/components/guest/GuestList';
import { BanGuestModal } from '@/components/guest/BanGuestModal';
import { ShowerBooking, LaundryBooking, BicycleRepairBooking } from '@/components/services';
import { WaiverModal } from '@/components/common/WaiverModal';
import type { GuestFormData } from '@/components/guest/GuestCreateForm';
import type { Guest } from '@/lib/types';
import { useUserRole } from '@/hooks/useUserRole';
import { todayPacificDateString } from '@/lib/utils/date';

export default function CheckInPage() {
  const { guests, fetchGuests, isLoading, addGuest, updateGuest, deleteGuest } = useGuestsStore();
  const { addMealRecord, getTodayMeals, undoMealForGuest } = useMealsStore();
  const { 
    getTodayShowers, 
    getTodayLaundry, 
    getTodayBicycles,
    addShowerRecord,
    addLaundryRecord,
    addBicycleRecord,
    showerRecords: allShowerRecords,
    laundryRecords: allLaundryRecords,
  } = useServicesStore();
  const { role } = useUserRole();

  // Modal states
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [showShowerModal, setShowShowerModal] = useState(false);
  const [showLaundryModal, setShowLaundryModal] = useState(false);
  const [showBicycleModal, setShowBicycleModal] = useState(false);
  const [banTarget, setBanTarget] = useState<Guest | null>(null);

  type WaiverService = 'shower' | 'laundry' | 'bicycle';
  const [showWaiverModal, setShowWaiverModal] = useState(false);
  const [pendingServiceAction, setPendingServiceAction] = useState<{
    guest: Guest;
    service: WaiverService;
    onContinue: () => void;
  } | null>(null);
  const [waiverSignatures, setWaiverSignatures] = useState<
    Record<string, Partial<Record<WaiverService, string>>>
  >({});

  // Determine if user can navigate to services
  const canNavigateToServices = role === 'admin' || role === 'staff';

  // Fetch guests on mount
  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

  // Get today's service records
  const todayShowerRecords = useMemo(() => {
    try {
      return getTodayShowers?.() || [];
    } catch {
      return [];
    }
  }, [getTodayShowers]);

  const todayLaundryRecords = useMemo(() => {
    try {
      return getTodayLaundry?.() || [];
    } catch {
      return [];
    }
  }, [getTodayLaundry]);

  // Calculate stats from records
  const showerStats = useMemo(() => {
    const total = 8; // Default total shower slots
    const booked = todayShowerRecords.filter(r => r.status === 'booked' || r.status === 'done').length;
    const waitlistCount = todayShowerRecords.filter(r => r.status === 'waitlisted').length;
    return {
      available: Math.max(0, total - booked),
      total,
      waitlistCount,
    };
  }, [todayShowerRecords]);

  const laundryStats = useMemo(() => {
    const total = 5; // Default total laundry slots
    const active = todayLaundryRecords.filter(r => 
      r.status === 'waiting' || r.status === 'washer' || r.status === 'dryer'
    ).length;
    return {
      available: Math.max(0, total - active),
      total,
    };
  }, [todayLaundryRecords]);

  // Get today's meal records
  const todayMealRecords = useMemo(() => {
    try {
      const meals = getTodayMeals?.() || [];
      return meals.map((meal) => ({
        id: meal.id,
        guestId: meal.guestId || '',
        date: meal.date,
      }));
    } catch {
      return [];
    }
  }, [getTodayMeals]);

  const ensureWaiverThen = useCallback(
    (guest: Guest, service: WaiverService, onContinue: () => void) => {
      const guestSignatures = waiverSignatures[guest.id] || {};
      const hasServicesWaiver = guestSignatures.shower || guestSignatures.laundry;
      if ((service === 'shower' || service === 'laundry') && hasServicesWaiver) {
        onContinue();
        return;
      }
      if (service === 'bicycle' && guestSignatures.bicycle) {
        onContinue();
        return;
      }
      setPendingServiceAction({ guest, service, onContinue });
      setShowWaiverModal(true);
    },
    [waiverSignatures]
  );

  const waiverModalWaivers = useMemo(() => {
    if (!pendingServiceAction) return [];
    const { guest, service } = pendingServiceAction;
    const guestSignatures = waiverSignatures[guest.id] || {};
    const sharedSignedAt = guestSignatures.shower || guestSignatures.laundry || null;

    if (service === 'bicycle') {
      return [
        {
          id: 'bicycle-waiver',
          name: 'Bicycle Program Waiver',
          description: 'Confirm bicycle waiver is signed before logging repair work.',
          required: true,
          signedAt: guestSignatures.bicycle || null,
        },
      ];
    }

    return [
      {
        id: 'services-waiver',
        name: 'Services Waiver',
        description: 'Required once per year and covers both shower and laundry services.',
        required: true,
        signedAt: sharedSignedAt,
      },
    ];
  }, [pendingServiceAction, waiverSignatures]);

  const handleWaiverSigned = useCallback(async () => {
    if (!pendingServiceAction) return;
    const { guest, service, onContinue } = pendingServiceAction;
    const timestamp = new Date().toISOString();

    setWaiverSignatures((prev) => {
      const guestRecord = prev[guest.id] || {};
      const updated = { ...guestRecord };
      if (service === 'bicycle') {
        updated.bicycle = timestamp;
      } else {
        updated.shower = timestamp;
        updated.laundry = timestamp;
      }
      return { ...prev, [guest.id]: updated };
    });

    setShowWaiverModal(false);
    setPendingServiceAction(null);
    onContinue();
  }, [pendingServiceAction]);

  const handleCloseWaiverModal = useCallback(() => {
    setShowWaiverModal(false);
    setPendingServiceAction(null);
  }, []);

  // Handler for adding a meal
  const handleAddMeal1 = useCallback(
    async (guestId: string) => {
      try {
        await addMealRecord?.(guestId, 1);
      } catch (error) {
        console.error('Failed to add 1 meal:', error);
      }
    },
    [addMealRecord]
  );

  const handleAddMeal2 = useCallback(
    async (guestId: string) => {
      try {
        await addMealRecord?.(guestId, 2);
      } catch (error) {
        console.error('Failed to add 2 meals:', error);
      }
    },
    [addMealRecord]
  );

  const handleAddExtraMeal = useCallback(
    async (guestId: string) => {
      try {
        await addMealRecord?.(guestId, 1);
      } catch (error) {
        console.error('Failed to add extra meal:', error);
      }
    },
    [addMealRecord]
  );

  const handleUndoMeal = useCallback(
    async (guestId: string) => {
      try {
        await undoMealForGuest?.(guestId);
      } catch (error) {
        console.error('Failed to undo meal:', error);
      }
    },
    [undoMealForGuest]
  );

  // Handler for adding a shower
  const handleAddShower = useCallback(
    (guestId: string) => {
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        ensureWaiverThen(guest, 'shower', () => {
          setSelectedGuest(guest);
          setShowShowerModal(true);
        });
      }
    },
    [guests, ensureWaiverThen]
  );

  // Handler for booking shower
  const handleBookShower = useCallback(
    async (guestId: string, slotTime: string) => {
      try {
        await addShowerRecord?.(guestId, slotTime);
        setShowShowerModal(false);
        setSelectedGuest(null);
      } catch (error) {
        console.error('Failed to book shower:', error);
      }
    },
    [addShowerRecord]
  );

  // Handler for adding laundry
  const handleAddLaundry = useCallback(
    (guestId: string) => {
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        ensureWaiverThen(guest, 'laundry', () => {
          setSelectedGuest(guest);
          setShowLaundryModal(true);
        });
      }
    },
    [guests, ensureWaiverThen]
  );

  // Handler for booking laundry
  const handleBookLaundry = useCallback(
    async (guestId: string, bagNumber: string, laundryType: 'onsite' | 'offsite') => {
      try {
        await addLaundryRecord?.(guestId, laundryType);
        setShowLaundryModal(false);
        setSelectedGuest(null);
      } catch (error) {
        console.error('Failed to book laundry:', error);
      }
    },
    [addLaundryRecord]
  );

  // Handler for adding bicycle service
  const handleAddBicycle = useCallback(
    (guestId: string) => {
      const guest = guests.find(g => g.id === guestId);
      if (guest) {
        ensureWaiverThen(guest, 'bicycle', () => {
          setSelectedGuest(guest);
          setShowBicycleModal(true);
        });
      }
    },
    [guests, ensureWaiverThen]
  );

  // Handler for submitting bicycle repair
  const handleSubmitBicycle = useCallback(
    async (guestId: string, data: { repairTypes: string[]; notes: string }) => {
      try {
        await addBicycleRecord?.(guestId, { repairTypes: data.repairTypes, notes: data.notes });
        setShowBicycleModal(false);
        setSelectedGuest(null);
      } catch (error) {
        console.error('Failed to add bicycle repair:', error);
      }
    },
    [addBicycleRecord]
  );

  // Handler for creating a new guest
  const handleCreateGuest = useCallback(
    async (formData: GuestFormData) => {
      if (!formData.age || !formData.gender) {
        throw new Error('Age group and gender are required');
      }
      await addGuest({
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        preferredName: formData.preferredName,
        housingStatus: formData.housingStatus,
        age: formData.age,
        gender: formData.gender,
        location: formData.location,
        notes: formData.notes,
        bicycleDescription: formData.bicycleDescription,
      });
    },
    [addGuest]
  );

  // Handler for editing a guest
  const handleEditGuest = useCallback(
    (guest: Guest) => {
      // TODO: Open edit modal
      console.log('Edit guest:', guest);
    },
    []
  );

  // Handler for deleting a guest
  const handleDeleteGuest = useCallback(
    async (guestId: string) => {
      if (confirm('Are you sure you want to delete this guest?')) {
        await deleteGuest(guestId);
      }
    },
    [deleteGuest]
  );

  // Handler for banning a guest
  const handleBanGuest = useCallback(
    async (guestId: string) => {
      const guest = guests.find((g) => g.id === guestId);
      if (guest) {
        setBanTarget(guest);
      }
    },
    [guests]
  );

  // Handler for clearing a ban
  const handleClearBan = useCallback(
    async (guestId: string) => {
      if (confirm('Are you sure you want to clear the ban for this guest?')) {
        await updateGuest(guestId, {
          bannedAt: null,
          bannedUntil: null,
          banReason: '',
          isBanned: false,
        });
      }
    },
    [updateGuest]
  );

  const handleConfirmBan = useCallback(
    async (reason: string, duration: string) => {
      if (!banTarget) return;
      const now = new Date();
      let bannedUntil: string | null = null;

      if (duration === '1d' || duration === '1w') {
        const hours = duration === '1d' ? 24 : 24 * 7;
        bannedUntil = new Date(now.getTime() + hours * 60 * 60 * 1000).toISOString();
      }

      await updateGuest(banTarget.id, {
        bannedAt: now.toISOString(),
        bannedUntil,
        banReason: reason,
        isBanned: true,
      });

      setBanTarget(null);
    },
    [banTarget, updateGuest]
  );

  const handleCloseBanModal = useCallback(() => {
    setBanTarget(null);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Welcome Banner */}
      <WelcomeBanner />

      {/* Service Status Overview */}
      <ServiceStatusOverview
        showerStats={showerStats}
        laundryStats={laundryStats}
        canNavigate={canNavigateToServices}
      />

      {/* Guest List Component */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden p-4">
        <GuestList
          guests={guests}
          isLoading={isLoading}
          todayMealRecords={todayMealRecords}
          todayShowerRecords={todayShowerRecords.map(r => ({ guestId: r.guestId, date: r.date }))}
          todayLaundryRecords={todayLaundryRecords.map(r => ({ guestId: r.guestId, date: r.date }))}
          onAddMeal1={handleAddMeal1}
          onAddMeal2={handleAddMeal2}
          onAddExtraMeal={handleAddExtraMeal}
          onUndoMeal={handleUndoMeal}
          onAddShower={handleAddShower}
          onAddLaundry={handleAddLaundry}
          onAddBicycle={handleAddBicycle}
          onEditGuest={handleEditGuest}
          onDeleteGuest={handleDeleteGuest}
          onBanGuest={handleBanGuest}
          onClearBan={handleClearBan}
          onCreateGuest={handleCreateGuest}
          showActions
        />
      </div>

      {/* Shower Booking Modal */}
      <ShowerBooking
        isOpen={showShowerModal}
        guest={selectedGuest}
        onClose={() => { setShowShowerModal(false); setSelectedGuest(null); }}
        onBook={handleBookShower}
        showerRecords={allShowerRecords as any}
        todayDateString={todayPacificDateString()}
      />

      {/* Laundry Booking Modal */}
      <LaundryBooking
        isOpen={showLaundryModal}
        guest={selectedGuest}
        onClose={() => { setShowLaundryModal(false); setSelectedGuest(null); }}
        onBook={handleBookLaundry}
        laundryRecords={allLaundryRecords as any}
        todayDateString={todayPacificDateString()}
      />

      {/* Bicycle Repair Modal */}
      {showBicycleModal && selectedGuest && (
        <BicycleRepairBooking
          guest={selectedGuest}
          onClose={() => { setShowBicycleModal(false); setSelectedGuest(null); }}
          onSubmit={handleSubmitBicycle}
        />
      )}

      <WaiverModal
        isOpen={showWaiverModal && Boolean(pendingServiceAction)}
        onClose={handleCloseWaiverModal}
        onSign={async () => handleWaiverSigned()}
        waivers={waiverModalWaivers}
      />

      <BanGuestModal
        isOpen={Boolean(banTarget)}
        guestName={banTarget ? `${banTarget.firstName} ${banTarget.lastName}` : ''}
        onClose={handleCloseBanModal}
        onBan={handleConfirmBan}
      />
    </div>
  );
}
