'use client';

import React, { useMemo, useState } from 'react';
import {
  User,
  Home,
  MapPin,
  CalendarClock,
  Utensils,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Ban,
  RotateCcw,
  Droplets,
  WashingMachine,
  Bike,
  Scissors,
  Gift,
  Undo2,
  Loader2,
} from 'lucide-react';
import type { Guest } from '@/lib/types';
import { enhancedToast } from '@/utils/toast';

interface ServiceRecord {
  guestId: string;
  date: string;
}

interface MealRecordWithId extends ServiceRecord {
  id: string;
}

interface GuestCardProps {
  guest: Guest;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onEdit?: (guest: Guest) => void;
  onDelete?: (guestId: string) => void;
  onBan?: (guestId: string) => void;
  onClearBan?: (guestId: string) => void;
  onAddMeal1?: (guestId: string) => Promise<void>;
  onAddMeal2?: (guestId: string) => Promise<void>;
  onAddExtraMeal?: (guestId: string) => Promise<void>;
  onUndoMeal?: (guestId: string) => Promise<void>;
  onAddShower?: (guestId: string) => void;
  onAddLaundry?: (guestId: string) => void;
  onAddHaircut?: (guestId: string) => void;
  onAddHoliday?: (guestId: string) => void;
  onAddBicycle?: (guestId: string) => void;
  // Service records for today
  todayMealRecords?: MealRecordWithId[];
  todayShowerRecords?: ServiceRecord[];
  todayLaundryRecords?: ServiceRecord[];
  todayHaircutRecords?: ServiceRecord[];
  todayHolidayRecords?: ServiceRecord[];
  todayBicycleRecords?: ServiceRecord[];
  className?: string;
  showActions?: boolean;
  compact?: boolean;
}

const formatDate = (dateString: string | null): string => {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const getDisplayName = (guest: Guest): string => {
  const fullName = `${guest.firstName} ${guest.lastName}`;
  if (guest.preferredName) {
    return `${guest.preferredName} (${fullName})`;
  }
  return fullName;
};

export function GuestCard({
  guest,
  isExpanded = false,
  onToggleExpand,
  onEdit,
  onDelete,
  onBan,
  onClearBan,
  onAddMeal1,
  onAddMeal2,
  onAddExtraMeal,
  onUndoMeal,
  onAddShower,
  onAddLaundry,
  onAddHaircut,
  onAddHoliday,
  onAddBicycle,
  todayMealRecords = [],
  todayShowerRecords = [],
  todayLaundryRecords = [],
  todayHaircutRecords = [],
  todayHolidayRecords = [],
  todayBicycleRecords = [],
  className = '',
  showActions = true,
  compact = false,
}: GuestCardProps) {
  const [mealLoading, setMealLoading] = useState(false);
  const [undoLoading, setUndoLoading] = useState(false);
  // optimistic local state: how many meals we've locally added but not yet reconciled
  const [pendingMeals, setPendingMeals] = useState(0);

  const guestMealRecords = useMemo(
    () => todayMealRecords.filter((r) => r.guestId === guest.id),
    [todayMealRecords, guest.id]
  );
  const mealCount = guestMealRecords.length;

  // effective values include optimistic pending meals so the UI updates immediately
  const effectiveMealCount = mealCount + pendingMeals;
  const effectiveHasMeal = effectiveMealCount > 0;
  // preserve previous variable name so other parts of the component continue working
  const hasMealToday = effectiveHasMeal;

  const handleAddMeals = async (
    amount: number,
    fn?: (id: string) => Promise<void>,
    messages?: { success?: string; error?: string }
  ) => {
    if (!fn) return;
    setMealLoading(true);
    setPendingMeals((p) => p + amount);
    try {
      await fn(guest.id);
      // success toast
      enhancedToast.success(messages?.success ?? `${amount} meal${amount > 1 ? 's' : ''} added`);
    } catch (e) {
      // rollback optimistic update on failure
      setPendingMeals((p) => p - amount);
      enhancedToast.error(messages?.error ?? 'Failed to add meal');
      console.error('Failed to add meal(s):', e);
    } finally {
      setMealLoading(false);
    }
  };

  const handleUndo = async () => {
    if (!onUndoMeal) return;
    setUndoLoading(true);
    try {
      if (pendingMeals > 0) {
        const count = pendingMeals;
        // if we optimistically added multiple meals, undo them one-by-one
        for (let i = 0; i < count; i++) {
          // onUndoMeal is expected to remove a single meal record
          await onUndoMeal(guest.id);
        }
        setPendingMeals(0);
        enhancedToast.success(`${count} meal${count > 1 ? 's' : ''} undone`);
      } else {
        await onUndoMeal(guest.id);
        enhancedToast.success('Meal undone');
      }
    } catch (e) {
      enhancedToast.error('Failed to undo meal');
      console.error('Failed to undo meal:', e);
    } finally {
      setUndoLoading(false);
    }
  };

  const hasShowerToday = useMemo(
    () => todayShowerRecords.some((r) => r.guestId === guest.id),
    [todayShowerRecords, guest.id]
  );
  const hasLaundryToday = useMemo(
    () => todayLaundryRecords.some((r) => r.guestId === guest.id),
    [todayLaundryRecords, guest.id]
  );
  const hasHaircutToday = useMemo(
    () => todayHaircutRecords.some((r) => r.guestId === guest.id),
    [todayHaircutRecords, guest.id]
  );
  const hasHolidayToday = useMemo(
    () => todayHolidayRecords.some((r) => r.guestId === guest.id),
    [todayHolidayRecords, guest.id]
  );
  const hasBicycleToday = useMemo(
    () => todayBicycleRecords.some((r) => r.guestId === guest.id),
    [todayBicycleRecords, guest.id]
  );

  const isBanned = guest.isBanned || guest.banned === true;

  return (
    <div
      className={`bg-white rounded-xl border ${
        isBanned ? 'border-red-300' : 'border-gray-200'
      } shadow-sm transition-all hover:shadow-md ${className}`}
    >
      {/* Header - Always visible */}
      <div
        className={`${compact ? 'p-3' : 'p-4'} ${onToggleExpand ? 'cursor-pointer hover:bg-gray-50' : ''}`}
        onClick={onToggleExpand}
        role={onToggleExpand ? 'button' : undefined}
        tabIndex={onToggleExpand ? 0 : undefined}
        onKeyDown={
          onToggleExpand
            ? (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleExpand();
                }
              }
            : undefined
        }
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center ${
                isBanned
                  ? 'bg-red-100 text-red-600'
                  : 'bg-emerald-100 text-emerald-600'
              }`}
            >
              <User size={20} />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                {getDisplayName(guest)}
                {isBanned && (
                  <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full">
                    <Ban size={12} /> Banned
                  </span>
                )}
              </h3>
              {!compact && (
                <div className="flex items-center gap-2 text-sm text-gray-500 mt-0.5">
                  <span className="flex items-center gap-1">
                    <Home size={14} />
                    {guest.housingStatus}
                  </span>
                  {guest.location && (
                    <span className="flex items-center gap-1">
                      <MapPin size={14} />
                      {guest.location}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Today's services indicator */}
          {!compact && (
            <div className="flex items-center gap-2">
            {hasMealToday && (
              <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center" title="Meal recorded today">
                <Utensils size={14} />
              </span>
            )}
            {hasShowerToday && (
              <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center" title="Shower recorded today">
                <Droplets size={14} />
              </span>
            )}
            {hasLaundryToday && (
              <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center" title="Laundry recorded today">
                <WashingMachine size={14} />
              </span>
            )}
            {hasHaircutToday && (
              <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center" title="Haircut recorded today">
                <Scissors size={14} />
              </span>
            )}
            {hasHolidayToday && (
              <span className="w-6 h-6 rounded-full bg-pink-100 text-pink-600 flex items-center justify-center" title="Holiday recorded today">
                <Gift size={14} />
              </span>
            )}
            {hasBicycleToday && (
              <span className="w-6 h-6 rounded-full bg-cyan-100 text-cyan-600 flex items-center justify-center" title="Bicycle service today">
                <Bike size={14} />
              </span>
            )}
            {onToggleExpand && (
              <button
                className="p-1 text-gray-400 hover:text-gray-600"
                aria-label={isExpanded ? 'Collapse' : 'Expand'}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleExpand();
                }}
              >
                {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </button>
            )}
            </div>
          )}
        </div>

        {/* Demographics */}
        {!compact && (
          <div className="flex items-center gap-4 mt-3 text-sm text-gray-600">
            <span>{guest.age}</span>
            <span>•</span>
            <span>{guest.gender}</span>
            {guest.visitCount !== undefined && guest.visitCount > 0 && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CalendarClock size={14} />
                  {guest.visitCount} visits
                </span>
              </>
            )}
          </div>
        )}
      </div>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-gray-100 p-4 space-y-4">
          {/* Last visit */}
          {guest.lastVisit && (
            <div className="text-sm text-gray-600">
              <span className="font-medium">Last visit:</span> {formatDate(guest.lastVisit)}
            </div>
          )}

          {/* Notes */}
          {guest.notes && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm text-gray-700">{guest.notes}</p>
            </div>
          )}

          {/* Bicycle description */}
          {guest.bicycleDescription && (
            <div className="bg-cyan-50 p-3 rounded-lg">
              <p className="text-sm text-cyan-800">
                <span className="font-medium">Bicycle:</span> {guest.bicycleDescription}
              </p>
            </div>
          )}

          {/* Ban reason */}
          {isBanned && guest.banReason && (
            <div className="bg-red-50 p-3 rounded-lg">
              <p className="text-sm text-red-800">
                <span className="font-medium">Ban reason:</span> {guest.banReason}
              </p>
            </div>
          )}

          {/* Action buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-2 pt-2">
              {/* Service buttons */}
              {!isBanned && (
                <>
                  {!effectiveHasMeal ? (
                    <>
                      {onAddMeal1 && (
                        <button
                          onClick={async () => {
                            await handleAddMeals(1, onAddMeal1);
                          }}
                          disabled={mealLoading}
                          className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {mealLoading && pendingMeals > 0 ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Utensils size={14} />
                          )}
                          1 Meal
                        </button>
                      )}
                      {onAddMeal2 && (
                        <button
                          onClick={async () => {
                            await handleAddMeals(2, onAddMeal2);
                          }}
                          disabled={mealLoading}
                          className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {mealLoading && pendingMeals > 0 ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Utensils size={14} />
                          )}
                          2 Meals
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="px-3 py-1.5 text-sm bg-emerald-500 text-white rounded-lg flex items-center gap-1 font-medium">
                        <Utensils size={14} /> {effectiveMealCount} Meal{effectiveMealCount > 1 ? 's' : ''} {mealLoading && pendingMeals > 0 ? '…' : '✓'}
                      </div>
                      {onUndoMeal && (
                        <button
                          onClick={handleUndo}
                          disabled={undoLoading}
                          className="px-3 py-1.5 text-sm bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Undo meal"
                        >
                          {undoLoading ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Undo2 size={14} />
                          )}
                          Undo
                        </button>
                      )}
                      {onAddExtraMeal && (
                        <button
                          onClick={async () => {
                            await handleAddMeals(1, onAddExtraMeal, { success: 'Extra meal added', error: 'Failed to add extra meal' });
                          }}
                          disabled={mealLoading}
                          className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {mealLoading && pendingMeals > 0 ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <Utensils size={14} />
                          )}
                          +Extra
                        </button>
                      )}
                    </>
                  )}
                  {onAddShower && !hasShowerToday && (
                    <button
                      onClick={() => onAddShower(guest.id)}
                      className="px-3 py-1.5 text-sm bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors flex items-center gap-1"
                    >
                      <Droplets size={14} /> Shower
                    </button>
                  )}
                  {onAddLaundry && !hasLaundryToday && (
                    <button
                      onClick={() => onAddLaundry(guest.id)}
                      className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors flex items-center gap-1"
                    >
                      <WashingMachine size={14} /> Laundry
                    </button>
                  )}
                  {onAddHaircut && !hasHaircutToday && (
                    <button
                      onClick={() => onAddHaircut(guest.id)}
                      className="px-3 py-1.5 text-sm bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors flex items-center gap-1"
                    >
                      <Scissors size={14} /> Haircut
                    </button>
                  )}
                  {onAddHoliday && !hasHolidayToday && (
                    <button
                      onClick={() => onAddHoliday(guest.id)}
                      className="px-3 py-1.5 text-sm bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition-colors flex items-center gap-1"
                    >
                      <Gift size={14} /> Holiday
                    </button>
                  )}
                  {onAddBicycle && !hasBicycleToday && (
                    <button
                      onClick={() => onAddBicycle(guest.id)}
                      className="px-3 py-1.5 text-sm bg-cyan-100 text-cyan-700 rounded-lg hover:bg-cyan-200 transition-colors flex items-center gap-1"
                    >
                      <Bike size={14} /> Bicycle
                    </button>
                  )}
                </>
              )}

              {/* Admin buttons */}
              <div className="flex-1" />
              {onEdit && (
                <button
                  onClick={() => onEdit(guest)}
                  className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-1"
                >
                  <Edit2 size={14} /> Edit
                </button>
              )}
              {isBanned && onClearBan && (
                <button
                  onClick={() => onClearBan(guest.id)}
                  className="px-3 py-1.5 text-sm bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors flex items-center gap-1"
                >
                  <RotateCcw size={14} /> Clear Ban
                </button>
              )}
              {!isBanned && onBan && (
                <button
                  onClick={() => onBan(guest.id)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <Ban size={14} /> Ban
                </button>
              )}
              {onDelete && (
                <button
                  onClick={() => onDelete(guest.id)}
                  className="px-3 py-1.5 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center gap-1"
                >
                  <Trash2 size={14} /> Delete
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default GuestCard;
