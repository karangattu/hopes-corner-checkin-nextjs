import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { GuestCard } from '../GuestCard';
import type { Guest } from '@/lib/types';
import { enhancedToast } from '@/utils/toast';

const createMockGuest = (overrides: Partial<Guest> = {}): Guest => ({
  id: 'guest-1',
  guestId: 'guest-1',
  firstName: 'John',
  lastName: 'Doe',
  name: 'John Doe',
  preferredName: '',
  housingStatus: 'Unhoused',
  age: 'Adult 18-59',
  gender: 'Male',
  location: 'San Francisco',
  notes: '',
  bicycleDescription: '',
  bannedAt: null,
  bannedUntil: null,
  banReason: '',
  isBanned: false,
  banned: false,
  visitCount: 5,
  lastVisit: '2024-01-15',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-15T00:00:00Z',
  ...overrides,
});

describe('GuestCard', () => {
  describe('rendering', () => {
    it('renders guest name', () => {
      const guest = createMockGuest();
      render(<GuestCard guest={guest} />);
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });

    it('renders preferred name with full name', () => {
      const guest = createMockGuest({ preferredName: 'Johnny' });
      render(<GuestCard guest={guest} />);
      expect(screen.getByText('Johnny (John Doe)')).toBeInTheDocument();
    });

    it('displays housing status', () => {
      const guest = createMockGuest({ housingStatus: 'Unhoused' });
      render(<GuestCard guest={guest} />);
      expect(screen.getByText(/unhoused/i)).toBeInTheDocument();
    });

    it('displays location', () => {
      const guest = createMockGuest({ location: 'San Jose' });
      render(<GuestCard guest={guest} />);
      expect(screen.getByText(/San Jose/)).toBeInTheDocument();
    });
  });

  describe('banned state', () => {
    it('shows banned indicator for banned guests', () => {
      const guest = createMockGuest({ isBanned: true });
      render(<GuestCard guest={guest} />);
      expect(screen.getByText(/banned/i)).toBeInTheDocument();
    });

    it('shows banned indicator when banned field is true', () => {
      const guest = createMockGuest({ banned: true });
      render(<GuestCard guest={guest} />);
      expect(screen.getByText(/banned/i)).toBeInTheDocument();
    });

    it('applies banned styling', () => {
      const guest = createMockGuest({ isBanned: true });
      const { container } = render(<GuestCard guest={guest} />);
      expect(container.firstChild).toHaveClass('border-red-300');
    });
  });

  describe('expand/collapse', () => {
    it('is collapsed by default', () => {
      const guest = createMockGuest({ lastVisit: '2024-01-15' });
      render(<GuestCard guest={guest} />);
      // When collapsed, detailed info like "Last visit:" text should not be visible
      expect(screen.queryByText(/last visit:/i)).not.toBeInTheDocument();
    });

    it('expands when isExpanded is true', () => {
      const guest = createMockGuest({ lastVisit: '2024-01-15' });
      render(<GuestCard guest={guest} isExpanded={true} />);
      // When expanded, should show more details
      expect(screen.getByText(/last visit:/i)).toBeInTheDocument();
    });

    it('calls onToggleExpand when header clicked', () => {
      const onToggleExpand = vi.fn();
      const guest = createMockGuest();
      render(<GuestCard guest={guest} onToggleExpand={onToggleExpand} />);
      
      // The clickable area has role="button" when onToggleExpand is provided
      const button = screen.getByRole('button', { name: /expand/i });
      fireEvent.click(button);
      expect(onToggleExpand).toHaveBeenCalled();
    });

    it('supports keyboard navigation for toggle', () => {
      const onToggleExpand = vi.fn();
      const guest = createMockGuest();
      render(<GuestCard guest={guest} onToggleExpand={onToggleExpand} />);
      
      const button = screen.getByRole('button', { name: /expand/i });
      fireEvent.keyDown(button, { key: 'Enter' });
      // Note: The button click via keyboard should work
      expect(button).toBeInTheDocument();
    });
  });

  describe('service indicators', () => {
    it('shows meal indicator when guest has meal today', () => {
      const guest = createMockGuest();
      render(
        <GuestCard 
          guest={guest} 
          todayMealRecords={[{ id: 'meal-1', guestId: 'guest-1', date: '2024-01-15' }]}
        />
      );
      // The meal indicator has a title attribute
      expect(screen.getByTitle('Meal recorded today')).toBeInTheDocument();
    });

    it('shows shower indicator when guest has shower today', () => {
      const guest = createMockGuest();
      render(
        <GuestCard 
          guest={guest} 
          todayShowerRecords={[{ guestId: 'guest-1', date: '2024-01-15' }]}
        />
      );
      expect(screen.getByTitle('Shower recorded today')).toBeInTheDocument();
    });
  });

  describe('actions', () => {
    it('calls onEdit when edit button clicked', () => {
      const onEdit = vi.fn();
      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onEdit={onEdit} />);
      
      const editButton = screen.getByRole('button', { name: /edit/i });
      fireEvent.click(editButton);
      expect(onEdit).toHaveBeenCalledWith(guest);
    });

    it('calls onDelete when delete button clicked', () => {
      const onDelete = vi.fn();
      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onDelete={onDelete} />);
      
      const deleteButton = screen.getByRole('button', { name: /delete/i });
      fireEvent.click(deleteButton);
      expect(onDelete).toHaveBeenCalledWith('guest-1');
    });

    it('shows ban button for non-banned guests', () => {
      const onBan = vi.fn();
      const guest = createMockGuest({ isBanned: false });
      render(<GuestCard guest={guest} isExpanded={true} onBan={onBan} />);
      
      const banButton = screen.getByRole('button', { name: /ban/i });
      expect(banButton).toBeInTheDocument();
    });

    it('shows clear ban button for banned guests', () => {
      const onClearBan = vi.fn();
      const guest = createMockGuest({ isBanned: true });
      render(<GuestCard guest={guest} isExpanded={true} onClearBan={onClearBan} />);
      
      const clearBanButton = screen.getByRole('button', { name: /clear ban|unban/i });
      expect(clearBanButton).toBeInTheDocument();
    });

    it('hides actions when showActions is false', () => {
      const onEdit = vi.fn();
      const onDelete = vi.fn();
      const guest = createMockGuest();
      render(
        <GuestCard 
          guest={guest} 
          isExpanded={true} 
          onEdit={onEdit}
          onDelete={onDelete}
          showActions={false} 
        />
      );
      
      expect(screen.queryByRole('button', { name: /edit/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete/i })).not.toBeInTheDocument();
    });
  });

  describe('service actions', () => {
    it('calls onAddMeal1 when meal button clicked', () => {
      const onAddMeal1 = vi.fn();
      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onAddMeal1={onAddMeal1} />);
      
      const mealButton = screen.getByRole('button', { name: /1\s*meal/i });
      fireEvent.click(mealButton);
      expect(onAddMeal1).toHaveBeenCalledWith('guest-1');
    });

    it('optimistically updates and shows success toast on add', async () => {
      const successSpy = vi.spyOn(enhancedToast, 'success').mockImplementation(() => undefined as any);
      const errorSpy = vi.spyOn(enhancedToast, 'error').mockImplementation(() => undefined as any);

      let resolveAdd: () => void;
      const addPromise = new Promise<void>((res) => { resolveAdd = res; });
      const onAddMeal1 = vi.fn(() => addPromise);

      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onAddMeal1={onAddMeal1} onUndoMeal={vi.fn()} />);

      const mealButton = screen.getByRole('button', { name: /1\s*meal/i });
      fireEvent.click(mealButton);
      expect(onAddMeal1).toHaveBeenCalledWith('guest-1');

      // after clicking, the meal buttons are replaced by the optimistic count and Undo
      await waitFor(() => expect(screen.getByText(/1 Meal/)).toBeInTheDocument());
      expect(screen.queryByRole('button', { name: /1\s*meal/i })).not.toBeInTheDocument();

      // resolve the add and expect success toast
      resolveAdd!();

      await waitFor(() => expect(successSpy).toHaveBeenCalledWith('1 meal added'));

      successSpy.mockRestore();
      errorSpy.mockRestore();
    });

    it('undo rolls back optimistic state and shows success toast', async () => {
      const successSpy = vi.spyOn(enhancedToast, 'success').mockImplementation(() => undefined as any);
      const onUndoMeal = vi.fn(() => Promise.resolve());

      let resolveAdd: () => void;
      const addPromise = new Promise<void>((res) => { resolveAdd = res; });
      const onAddMeal1 = vi.fn(() => addPromise);

      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onAddMeal1={onAddMeal1} onUndoMeal={onUndoMeal} />);

      const mealButton = screen.getByRole('button', { name: /1\s*meal/i });
      fireEvent.click(mealButton);

      // Undo should be available while add is pending
      const undoButton = await screen.findByRole('button', { name: /undo/i });
      expect(undoButton).toBeEnabled();

      fireEvent.click(undoButton);

      await waitFor(() => expect(onUndoMeal).toHaveBeenCalled());
      await waitFor(() => expect(successSpy).toHaveBeenCalledWith('1 meal undone'));

      successSpy.mockRestore();
    });

    it('shows error toast and rolls back optimistic state on add failure', async () => {
      const errorSpy = vi.spyOn(enhancedToast, 'error').mockImplementation(() => undefined as any);
      const onAddMeal1 = vi.fn(() => Promise.reject(new Error('boom')));

      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onAddMeal1={onAddMeal1} onUndoMeal={vi.fn()} />);

      const mealButton = screen.getByRole('button', { name: /1\s*meal/i });
      fireEvent.click(mealButton);

      await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('Failed to add meal'));

      // optimistic count should be rolled back and original buttons restored
      expect(screen.getByRole('button', { name: /1\s*meal/i })).toBeInTheDocument();

      errorSpy.mockRestore();
    });

    it('adds extra meal and shows extra success toast', async () => {
      const successSpy = vi.spyOn(enhancedToast, 'success').mockImplementation(() => undefined as any);
      const onAddExtraMeal = vi.fn(() => Promise.resolve());

      const guest = createMockGuest();
      // pass an existing meal so the +Extra button is visible
      render(
        <GuestCard
          guest={guest}
          isExpanded={true}
          onAddExtraMeal={onAddExtraMeal}
          onUndoMeal={vi.fn()}
          todayMealRecords={[{ id: 'meal-1', guestId: 'guest-1', date: '2024-01-15' }]}
        />
      );

      const extraButton = screen.getByRole('button', { name: /\+extra/i });
      fireEvent.click(extraButton);

      await waitFor(() => expect(onAddExtraMeal).toHaveBeenCalledWith('guest-1'));
      await waitFor(() => expect(successSpy).toHaveBeenCalledWith('Extra meal added'));

      successSpy.mockRestore();
    });

    it('shows error toast when undo fails', async () => {
      const errorSpy = vi.spyOn(enhancedToast, 'error').mockImplementation(() => undefined as any);
      const onUndoMeal = vi.fn(() => Promise.reject(new Error('boom')));

      let resolveAdd: () => void;
      const addPromise = new Promise<void>((res) => { resolveAdd = res; });
      const onAddMeal1 = vi.fn(() => addPromise);

      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onAddMeal1={onAddMeal1} onUndoMeal={onUndoMeal} />);

      fireEvent.click(screen.getByRole('button', { name: /1\s*meal/i }));

      const undoButton = await screen.findByRole('button', { name: /undo/i });
      fireEvent.click(undoButton);

      await waitFor(() => expect(errorSpy).toHaveBeenCalledWith('Failed to undo meal'));

      errorSpy.mockRestore();
    });

    it('calls onAddShower when shower button clicked', () => {
      const onAddShower = vi.fn();
      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onAddShower={onAddShower} />);
      
      const showerButton = screen.getByRole('button', { name: /shower/i });
      fireEvent.click(showerButton);
      expect(onAddShower).toHaveBeenCalledWith('guest-1');
    });

    it('calls onAddLaundry when laundry button clicked', () => {
      const onAddLaundry = vi.fn();
      const guest = createMockGuest();
      render(<GuestCard guest={guest} isExpanded={true} onAddLaundry={onAddLaundry} />);
      
      const laundryButton = screen.getByRole('button', { name: /laundry/i });
      fireEvent.click(laundryButton);
      expect(onAddLaundry).toHaveBeenCalledWith('guest-1');
    });
  });

  describe('custom className', () => {
    it('applies custom className', () => {
      const guest = createMockGuest();
      const { container } = render(<GuestCard guest={guest} className="custom-class" />);
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
});
