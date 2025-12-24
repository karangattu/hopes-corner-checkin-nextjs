'use client';

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Search, UserPlus, X, ChevronDown, Users } from 'lucide-react';
import { List as VirtualList, type RowComponentProps } from 'react-window';
import { GuestCard } from './GuestCard';
import { GuestCreateForm, GuestFormData, FieldErrors } from './GuestCreateForm';
import { ListSkeleton } from '@/components/ui/Skeleton';
import type { Guest, HousingStatus } from '@/lib/types';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface ServiceRecord {
  guestId: string;
  date: string;
}

interface MealRecordWithId extends ServiceRecord {
  id: string;
}

interface GuestListProps {
  guests: Guest[];
  isLoading?: boolean;
  // Service records for today
  todayMealRecords?: MealRecordWithId[];
  todayShowerRecords?: ServiceRecord[];
  todayLaundryRecords?: ServiceRecord[];
  todayHaircutRecords?: ServiceRecord[];
  todayHolidayRecords?: ServiceRecord[];
  todayBicycleRecords?: ServiceRecord[];
  // Handlers
  onAddMeal1?: (guestId: string) => Promise<void>;
  onAddMeal2?: (guestId: string) => Promise<void>;
  onAddExtraMeal?: (guestId: string) => Promise<void>;
  onUndoMeal?: (guestId: string) => Promise<void>;
  onAddShower?: (guestId: string) => void;
  onAddLaundry?: (guestId: string) => void;
  onAddHaircut?: (guestId: string) => void;
  onAddHoliday?: (guestId: string) => void;
  onAddBicycle?: (guestId: string) => void;
  onEditGuest?: (guest: Guest) => void;
  onDeleteGuest?: (guestId: string) => void;
  onBanGuest?: (guestId: string) => void;
  onClearBan?: (guestId: string) => void;
  onCreateGuest?: (formData: GuestFormData) => Promise<void>;
  // Config
  showCreateForm?: boolean;
  enableSearch?: boolean;
  enableSort?: boolean;
  showActions?: boolean;
}

type SortKey = 'name' | 'lastVisit' | 'visitCount' | 'housingStatus';
type SortDirection = 'asc' | 'desc';

const COMPACT_THRESHOLD = 5;
const VIRTUALIZE_THRESHOLD = 40;

const INITIAL_FORM_DATA: GuestFormData = {
  firstName: '',
  lastName: '',
  preferredName: '',
  housingStatus: 'Unhoused' as HousingStatus,
  age: '',
  gender: '',
  location: '',
  notes: '',
  bicycleDescription: '',
};

export function GuestList({
  guests,
  isLoading = false,
  todayMealRecords = [],
  todayShowerRecords = [],
  todayLaundryRecords = [],
  todayHaircutRecords = [],
  todayHolidayRecords = [],
  todayBicycleRecords = [],
  onAddMeal1,
  onAddMeal2,
  onAddExtraMeal,
  onUndoMeal,
  onAddShower,
  onAddLaundry,
  onAddHaircut,
  onAddHoliday,
  onAddBicycle,
  onEditGuest,
  onDeleteGuest,
  onBanGuest,
  onClearBan,
  onCreateGuest,
  showCreateForm: showCreateFormProp = true,
  enableSearch = true,
  enableSort = true,
  showActions = true,
}: GuestListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey | null; direction: SortDirection }>({
    key: null,
    direction: 'asc',
  });
  const [nameSortMode, setNameSortMode] = useState<'first' | 'last'>('first');
  const [expandedGuestId, setExpandedGuestId] = useState<string | null>(null);
  const [activeResultIndex, setActiveResultIndex] = useState<number>(-1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState<GuestFormData>(INITIAL_FORM_DATA);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  const firstNameRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isTypingInInput = useCallback(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active) return false;
    const tag = active.tagName.toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return true;
    return active.isContentEditable;
  }, []);

  useKeyboardShortcuts(
    enableSearch
      ? [
          {
            key: 'k',
            ctrl: true,
            action: () => {
              searchInputRef.current?.focus();
            },
          },
          {
            key: 'g',
            ctrl: true,
            alt: true,
            action: () => {
              if (isTypingInInput()) return;
              if (!showCreateFormProp || !onCreateGuest) return;
              setShowCreateForm(true);
              setTimeout(() => firstNameRef.current?.focus(), 0);
            },
          },
        ]
      : []
  );

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const normalizedQuery = useMemo(() => {
    const queryRaw = debouncedSearchTerm.trim();
    if (!queryRaw) return '';
    return queryRaw.toLowerCase().replace(/\s+/g, ' ');
  }, [debouncedSearchTerm]);

  const queryTokens = useMemo(() => {
    if (!normalizedQuery) return [];
    return normalizedQuery.split(' ').filter(Boolean);
  }, [normalizedQuery]);

  const rankGuest = useCallback(
    (guest: Guest, query: string, tokens: string[]): number => {
      if (!query) return 99;

      const firstNameNormalized = (guest.firstName || '').toLowerCase().trim();
      const lastNameNormalized = (guest.lastName || '').toLowerCase().trim();
      const preferredNameNormalized = (guest.preferredName || '').toLowerCase().trim();

      const firstNameParts = firstNameNormalized.split(/\s+/).filter(Boolean);
      const allTokens = [...firstNameParts, lastNameNormalized].filter(Boolean);
      const fullName = `${firstNameNormalized} ${lastNameNormalized}`.trim();

      const queryLenOk = query.length >= 3;

      // Preferred name: higher priority than legal name
      if (preferredNameNormalized) {
        if (preferredNameNormalized === query) return -1;
        if (preferredNameNormalized.startsWith(query)) return 0;
        if (queryLenOk && preferredNameNormalized.includes(query)) return 1;
      }

      // Exact full match
      if (fullName === query) return -1;

      // Single-token query
      if (tokens.length === 1) {
        const q = tokens[0];
        for (const token of allTokens) {
          if (token === q) return 0;
        }
        for (const token of allTokens) {
          if (token.startsWith(q)) return 1;
        }
        if (queryLenOk) {
          for (const token of allTokens) {
            if (token.includes(q)) return 2;
          }
        }
        return 99;
      }

      // Multi-token query
      const tokenLenOk = tokens.every((t) => t.length >= 3);

      // Sequential window match across tokens
      const windowMatch = (mode: 'exact' | 'prefix' | 'substring'): boolean => {
        if (tokens.length > allTokens.length) return false;
        for (let start = 0; start <= allTokens.length - tokens.length; start++) {
          let ok = true;
          for (let i = 0; i < tokens.length; i++) {
            const q = tokens[i];
            const t = allTokens[start + i];
            if (mode === 'exact') {
              if (t !== q) ok = false;
            } else if (mode === 'prefix') {
              if (!t.startsWith(q)) ok = false;
            } else {
              if (!tokenLenOk) return false;
              if (!t.includes(q)) ok = false;
            }
            if (!ok) break;
          }
          if (ok) return true;
        }
        return false;
      };

      if (windowMatch('exact')) return 0;
      if (windowMatch('prefix')) return 1;
      if (windowMatch('substring')) return 2;

      // Any-order exact/prefix matches for all query tokens
      const anyOrderAll = (mode: 'exact' | 'prefix'): boolean => {
        return tokens.every((q) =>
          allTokens.some((t) => (mode === 'exact' ? t === q : t.startsWith(q)))
        );
      };

      if (anyOrderAll('exact')) return 0;
      if (anyOrderAll('prefix')) return 1;

      // Non-sequential but in-order prefix match
      let cursor = 0;
      let inOrder = true;
      for (const q of tokens) {
        let found = false;
        for (; cursor < allTokens.length; cursor++) {
          if (allTokens[cursor].startsWith(q)) {
            found = true;
            cursor++;
            break;
          }
        }
        if (!found) {
          inOrder = false;
          break;
        }
      }
      if (inOrder) return 1;

      // Loose match: concatenated query appears in concatenated name tokens
      const queryStr = tokens.join('');
      const nameStr = allTokens.join('');
      if (queryStr && (nameStr.includes(queryStr) || (queryLenOk && fullName.includes(query)))) return 3;

      return 99;
    },
    []
  );

  const filteredGuests = useMemo(() => {
    // Privacy-first: do not show any guest names until a search is entered
    if (!normalizedQuery) return [];

    const ranked: Array<{ guest: Guest; rank: number; label: string }> = [];
    for (const guest of guests) {
      const rank = rankGuest(guest, normalizedQuery, queryTokens);
      if (rank === 99) continue;
      const label = `${guest.preferredName ? guest.preferredName + ' ' : ''}${guest.firstName} ${guest.lastName}`
        .trim()
        .toLowerCase();
      ranked.push({ guest, rank, label });
    }

    ranked.sort((a, b) => {
      if (a.rank !== b.rank) return a.rank - b.rank;
      if (a.label < b.label) return -1;
      if (a.label > b.label) return 1;
      return 0;
    });

    // Dedupe by guest.id, keep first
    const seen = new Set<string>();
    const result: Guest[] = [];
    for (const item of ranked) {
      if (seen.has(item.guest.id)) continue;
      seen.add(item.guest.id);
      result.push(item.guest);
    }

    // Apply optional sort override (after name match ranking)
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aVal: string | number = '';
        let bVal: string | number = '';

        switch (sortConfig.key) {
          case 'name':
            aVal =
              nameSortMode === 'last'
                ? `${a.lastName} ${a.firstName}`.toLowerCase()
                : `${a.firstName} ${a.lastName}`.toLowerCase();
            bVal =
              nameSortMode === 'last'
                ? `${b.lastName} ${b.firstName}`.toLowerCase()
                : `${b.firstName} ${b.lastName}`.toLowerCase();
            break;
          case 'lastVisit':
            aVal = a.lastVisit || '';
            bVal = b.lastVisit || '';
            break;
          case 'visitCount':
            aVal = a.visitCount || 0;
            bVal = b.visitCount || 0;
            break;
          case 'housingStatus':
            aVal = a.housingStatus;
            bVal = b.housingStatus;
            break;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [guests, nameSortMode, normalizedQuery, queryTokens, rankGuest, sortConfig]);

  useEffect(() => {
    if (!normalizedQuery) {
      setActiveResultIndex(-1);
      return;
    }
    if (filteredGuests.length === 0) {
      setActiveResultIndex(-1);
      return;
    }
    setActiveResultIndex((prev) => {
      if (prev < 0) return 0;
      if (prev >= filteredGuests.length) return filteredGuests.length - 1;
      return prev;
    });
  }, [filteredGuests.length, normalizedQuery]);

  const levenshteinDistance = useCallback((a: string, b: string) => {
    if (a === b) return 0;
    if (!a) return b.length;
    if (!b) return a.length;

    const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;
    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }, []);

  const normalizedSimilarity = useCallback(
    (a: string, b: string) => {
      const aa = a.trim().toLowerCase();
      const bb = b.trim().toLowerCase();
      if (!aa || !bb) return 0;
      const maxLen = Math.max(aa.length, bb.length);
      if (maxLen === 0) return 1;
      const dist = levenshteinDistance(aa, bb);
      return 1 - dist / maxLen;
    },
    [levenshteinDistance]
  );

  const phoneticNormalize = useCallback((s: string) => {
    const str = s.toLowerCase().replace(/[^a-z]/g, '');
    const vowelsNormalized = str.replace(/[aeiouy]/g, 'a');
    const simplified = vowelsNormalized
      .replace(/ph/g, 'f')
      .replace(/ck/g, 'k')
      .replace(/c/g, 'k')
      .replace(/q/g, 'k')
      .replace(/x/g, 'ks')
      .replace(/z/g, 's')
      .replace(/v/g, 'f');
    return simplified.replace(/(.)\1+/g, '$1');
  }, []);

  const startsLikelyMatchBonus = useCallback((a: string, b: string) => {
    const aa = a.trim().toLowerCase();
    const bb = b.trim().toLowerCase();
    if (!aa || !bb) return 0;
    if (aa[0] === bb[0]) return 0.1;
    if (aa.length >= 2 && bb.length >= 2) {
      if (aa[0] === bb[1] && aa[1] === bb[0]) return 0.1;
    }
    return 0;
  }, []);

  const fuzzySuggestions = useMemo(() => {
    if (!normalizedQuery) return [];
    if (filteredGuests.length > 0) return [];

    const tokens = queryTokens;
    const candidates: Array<{ guest: Guest; score: number }> = [];

    for (const guest of guests) {
      const first = (guest.firstName || '').toLowerCase().trim();
      const last = (guest.lastName || '').toLowerCase().trim();
      const pref = (guest.preferredName || '').toLowerCase().trim();
      const full = `${first} ${last}`.trim();

      let score = 0;
      if (tokens.length === 1) {
        const q = tokens[0];
        score = Math.max(
          normalizedSimilarity(q, first),
          normalizedSimilarity(q, last),
          pref ? normalizedSimilarity(q, pref) : 0,
          normalizedSimilarity(q, full)
        );
        score += startsLikelyMatchBonus(q, pref || full);
        if (phoneticNormalize(q) === phoneticNormalize(pref || full)) score += 0.15;
      } else {
        const firstToken = tokens[0];
        const secondToken = tokens[1] || '';

        const forward = (normalizedSimilarity(firstToken, first) + normalizedSimilarity(secondToken, last)) / 2;
        const reversed = (normalizedSimilarity(firstToken, last) + normalizedSimilarity(secondToken, first)) / 2;
        const fullScore = normalizedSimilarity(normalizedQuery, full);

        score = Math.max(forward, reversed, fullScore);
        score += startsLikelyMatchBonus(firstToken, first);
        if (phoneticNormalize(normalizedQuery) === phoneticNormalize(full)) score += 0.15;
      }

      if (score > 0.5 && score < 1.0) {
        candidates.push({ guest, score });
      }
    }

    candidates.sort((a, b) => b.score - a.score);
    return candidates.slice(0, 5);
  }, [filteredGuests.length, guests, normalizedQuery, queryTokens, normalizedSimilarity, startsLikelyMatchBonus, phoneticNormalize]);

  const handleSort = useCallback((key: SortKey) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  const handleToggleExpand = useCallback((guestId: string) => {
    setExpandedGuestId((prev) => (prev === guestId ? null : guestId));
  }, []);

  const handleFormChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
      // Clear error for this field
      setFieldErrors((prev) => ({ ...prev, [name]: undefined }));
    },
    []
  );

  const handleLocationChange = useCallback((value: string) => {
    setFormData((prev) => ({ ...prev, location: value }));
    setFieldErrors((prev) => ({ ...prev, location: undefined }));
  }, []);

  const handleNameBlur = useCallback(() => {
    // Check for duplicates
    if (formData.firstName && formData.lastName) {
      const fullName = `${formData.firstName} ${formData.lastName}`.toLowerCase();
      const duplicate = guests.find(
        (g) => `${g.firstName} ${g.lastName}`.toLowerCase() === fullName
      );
      if (duplicate) {
        setDuplicateWarning(
          `A guest named "${duplicate.firstName} ${duplicate.lastName}" already exists.`
        );
      } else {
        setDuplicateWarning(null);
      }
    }
  }, [formData.firstName, formData.lastName, guests]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      // Validate required fields
      const errors: FieldErrors = {};
      if (!formData.firstName.trim()) errors.firstName = 'First name is required';
      if (!formData.lastName.trim()) errors.lastName = 'Last name is required';
      if (!formData.age) errors.age = 'Age group is required';
      if (!formData.gender) errors.gender = 'Gender is required';

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }

      if (!onCreateGuest) return;

      setIsCreating(true);
      setCreateError(null);

      try {
        await onCreateGuest(formData);
        // Reset form
        setFormData(INITIAL_FORM_DATA);
        setShowCreateForm(false);
        setDuplicateWarning(null);
      } catch (error) {
        setCreateError(error instanceof Error ? error.message : 'Failed to create guest');
      } finally {
        setIsCreating(false);
      }
    },
    [formData, onCreateGuest]
  );

  const handleCancelCreate = useCallback(() => {
    setShowCreateForm(false);
    setFormData(INITIAL_FORM_DATA);
    setFieldErrors({});
    setCreateError(null);
    setDuplicateWarning(null);
  }, []);

  if (isLoading) {
    return <ListSkeleton count={5} />;
  }

  const isCompact = filteredGuests.length > COMPACT_THRESHOLD;
  const shouldVirtualize = filteredGuests.length > VIRTUALIZE_THRESHOLD && !showActions;

  const handleEnterToCreate = () => {
    if (!showCreateFormProp || !onCreateGuest) return;
    if (!normalizedQuery) return;
    if (filteredGuests.length > 0) return;
    if (showCreateForm) return;

    const parts = normalizedQuery.split(' ').filter(Boolean);
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ');

    setFormData((prev) => ({
      ...prev,
      firstName: firstName ? firstName[0].toUpperCase() + firstName.slice(1) : '',
      lastName: lastName ? lastName[0].toUpperCase() + lastName.slice(1) : '',
    }));
    setShowCreateForm(true);
    setTimeout(() => firstNameRef.current?.focus(), 0);
  };

  const GuestRow = ({ index, style, ariaAttributes }: RowComponentProps) => {
    const guest = filteredGuests[index];
    return (
      <div style={style} {...ariaAttributes} className="pr-2">
        <GuestCard
          key={guest.id}
          guest={guest}
          isExpanded={false}
          onToggleExpand={undefined}
          onEdit={onEditGuest}
          onDelete={onDeleteGuest}
          onBan={onBanGuest}
          onClearBan={onClearBan}
          onAddMeal1={onAddMeal1}
          onAddMeal2={onAddMeal2}
          onAddExtraMeal={onAddExtraMeal}
          onUndoMeal={onUndoMeal}
          onAddShower={onAddShower}
          onAddLaundry={onAddLaundry}
          onAddHaircut={onAddHaircut}
          onAddHoliday={onAddHoliday}
          onAddBicycle={onAddBicycle}
          todayMealRecords={todayMealRecords}
          todayShowerRecords={todayShowerRecords}
          todayLaundryRecords={todayLaundryRecords}
          todayHaircutRecords={todayHaircutRecords}
          todayHolidayRecords={todayHolidayRecords}
          todayBicycleRecords={todayBicycleRecords}
          showActions={showActions}
          compact
        />
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Find or Add Guests</h2>
            <p className="text-sm text-gray-600 mt-1">
              Search to view and check in guests. Names stay hidden until you search.
            </p>
          </div>

          {showCreateFormProp && onCreateGuest && !showCreateForm && (
            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
            >
              <UserPlus size={18} />
              <span>Add Guest</span>
            </button>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
            <kbd className="font-mono">Ctrl/⌘</kbd>
            <span>+</span>
            <kbd className="font-mono">K</kbd>
            <span>Search</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
            <kbd className="font-mono">↑</kbd>
            <kbd className="font-mono">↓</kbd>
            <span>Navigate</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
            <kbd className="font-mono">Enter</kbd>
            <span>Select</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
            <kbd className="font-mono">Esc</kbd>
            <span>Clear</span>
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-50 border border-gray-200">
            <kbd className="font-mono">Ctrl/⌘</kbd>
            <span>+</span>
            <kbd className="font-mono">Alt</kbd>
            <span>+</span>
            <kbd className="font-mono">G</kbd>
            <span>Add</span>
          </span>
          <span className="text-gray-400">Tip: Expand a guest to log meals/showers/laundry</span>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          {enableSearch && (
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') {
                    e.preventDefault();
                    setSearchTerm('');
                    setExpandedGuestId(null);
                    setActiveResultIndex(-1);
                    return;
                  }
                  if (e.key === 'ArrowDown') {
                    if (filteredGuests.length === 0) return;
                    e.preventDefault();
                    setActiveResultIndex((prev) =>
                      Math.min((prev < 0 ? 0 : prev + 1), filteredGuests.length - 1)
                    );
                    return;
                  }
                  if (e.key === 'ArrowUp') {
                    if (filteredGuests.length === 0) return;
                    e.preventDefault();
                    setActiveResultIndex((prev) => Math.max((prev < 0 ? 0 : prev - 1), 0));
                    return;
                  }
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    if (filteredGuests.length > 0 && activeResultIndex >= 0) {
                      const guest = filteredGuests[activeResultIndex];
                      if (guest) setExpandedGuestId(guest.id);
                      return;
                    }
                    handleEnterToCreate();
                  }
                }}
                ref={searchInputRef}
                placeholder="Type a name to search…"
                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900 placeholder:text-gray-600"
              />
              {searchTerm && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setExpandedGuestId(null);
                    setActiveResultIndex(-1);
                  }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  aria-label="Clear search"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          )}

          {enableSort && (
            <div className="flex items-center gap-2">
              <div className="inline-flex rounded-lg border border-gray-300 overflow-hidden bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setNameSortMode('first');
                    setSortConfig({ key: 'name', direction: 'asc' });
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors ${
                    sortConfig.key === 'name' && nameSortMode === 'first'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-pressed={sortConfig.key === 'name' && nameSortMode === 'first'}
                >
                  First Name
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameSortMode('last');
                    setSortConfig({ key: 'name', direction: 'asc' });
                  }}
                  className={`px-3 py-2 text-sm font-medium transition-colors border-l border-gray-300 ${
                    sortConfig.key === 'name' && nameSortMode === 'last'
                      ? 'bg-gray-900 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  aria-pressed={sortConfig.key === 'name' && nameSortMode === 'last'}
                >
                  Last Name
                </button>
              </div>

              <div className="relative">
                <select
                  value={sortConfig.key || ''}
                  onChange={(e) => handleSort(e.target.value as SortKey)}
                  className="appearance-none px-4 py-2 pr-8 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 bg-white text-gray-900"
                >
                  <option value="">Sort by...</option>
                  <option value="name">Name</option>
                  <option value="lastVisit">Last Visit</option>
                  <option value="visitCount">Visit Count</option>
                  <option value="housingStatus">Housing Status</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          )}
        </div>

        {normalizedQuery && (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="text-xs font-semibold text-emerald-700 uppercase tracking-wide">
              Results
            </div>
            <div className="mt-1 text-sm text-emerald-900">
              Showing <span className="font-semibold">{filteredGuests.length}</span>{' '}
              guest{filteredGuests.length === 1 ? '' : 's'} matching{' '}
              <span className="font-semibold">“{debouncedSearchTerm}”</span>
            </div>
          </div>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <GuestCreateForm
          formData={formData}
          fieldErrors={fieldErrors}
          isCreating={isCreating}
          createError={createError}
          duplicateWarning={duplicateWarning}
          onChange={handleFormChange}
          onNameBlur={handleNameBlur}
          onSubmit={handleSubmit}
          onCancel={handleCancelCreate}
          onLocationChange={handleLocationChange}
          firstNameRef={firstNameRef}
        />
      )}

      {/* Privacy-first empty state */}
      {!normalizedQuery ? (
        <div className="text-center py-12">
          <div className="mx-auto max-w-md bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
              <Search size={22} />
            </div>
            <h3 className="mt-4 font-semibold text-gray-900">Ready to search</h3>
            <p className="mt-2 text-sm text-gray-600">
              Start typing a name to find guests. For privacy, no names are shown until you search.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-50 text-gray-600 text-xs font-medium">
              Privacy-first design
            </div>
          </div>
        </div>
      ) : (
        <>
          <p className="text-xs text-gray-500">
            Tip: Press Enter to create when no match • Click a guest (or the chevron) to log meals/showers/laundry
          </p>

          {/* Suggestions */}
          {filteredGuests.length === 0 && fuzzySuggestions.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
              <p className="text-sm font-medium text-gray-900">Did you mean?</p>
              <div className="flex flex-wrap gap-2">
                {fuzzySuggestions.map(({ guest }) => {
                  const label = guest.preferredName
                    ? `${guest.preferredName} (${guest.firstName} ${guest.lastName})`
                    : `${guest.firstName} ${guest.lastName}`;
                  return (
                    <button
                      key={guest.id}
                      onClick={() => {
                        setSearchTerm(label);
                        setDebouncedSearchTerm(label);
                        setExpandedGuestId(guest.id);
                      }}
                      className="px-3 py-1.5 rounded-lg bg-gray-50 text-gray-800 hover:bg-gray-100 text-sm"
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Guest list */}
          {filteredGuests.length === 0 ? (
            <div className="text-center py-12 text-gray-500 space-y-3">
              <p>No guests found matching &quot;{debouncedSearchTerm}&quot;</p>
              {showCreateFormProp && onCreateGuest && (
                <button
                  onClick={handleEnterToCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
                >
                  <UserPlus size={18} />
                  Create guest
                </button>
              )}
            </div>
          ) : shouldVirtualize ? (
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
              <VirtualList
                rowCount={filteredGuests.length}
                rowComponent={GuestRow}
                rowHeight={96}
                style={{ height: 600, width: '100%' }}
              >
                {null}
              </VirtualList>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGuests.map((guest, index) => (
                <div
                  key={guest.id}
                  className={
                    index === activeResultIndex
                      ? 'ring-2 ring-emerald-300 rounded-xl'
                      : undefined
                  }
                >
                  <GuestCard
                    guest={guest}
                    isExpanded={expandedGuestId === guest.id}
                    onToggleExpand={() => handleToggleExpand(guest.id)}
                    onEdit={onEditGuest}
                    onDelete={onDeleteGuest}
                    onBan={onBanGuest}
                    onClearBan={onClearBan}
                    onAddMeal1={onAddMeal1}
                    onAddMeal2={onAddMeal2}
                    onAddExtraMeal={onAddExtraMeal}
                    onUndoMeal={onUndoMeal}
                    onAddShower={onAddShower}
                    onAddLaundry={onAddLaundry}
                    onAddHaircut={onAddHaircut}
                    onAddHoliday={onAddHoliday}
                    onAddBicycle={onAddBicycle}
                    todayMealRecords={todayMealRecords}
                    todayShowerRecords={todayShowerRecords}
                    todayLaundryRecords={todayLaundryRecords}
                    todayHaircutRecords={todayHaircutRecords}
                    todayHolidayRecords={todayHolidayRecords}
                    todayBicycleRecords={todayBicycleRecords}
                    showActions={showActions}
                    compact={isCompact}
                  />
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default GuestList;
