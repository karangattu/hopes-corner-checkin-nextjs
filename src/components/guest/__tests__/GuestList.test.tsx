import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GuestList } from '@/components/guest/GuestList';
import type { Guest } from '@/lib/types';

const baseGuests: Guest[] = [
  {
    id: '1',
    firstName: 'John',
    lastName: 'Smith',
    preferredName: '',
    housingStatus: 'Unhoused',
    age: 'Adult 18-59',
    gender: 'Male',
    location: 'Mountain View',
    notes: '',
    bicycleDescription: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visitCount: 1,
    lastVisit: null,
  } as unknown as Guest,
  {
    id: '2',
    firstName: 'Jane',
    lastName: 'Doe',
    preferredName: 'Janey',
    housingStatus: 'Sheltered',
    age: 'Adult 18-59',
    gender: 'Female',
    location: 'Sunnyvale',
    notes: '',
    bicycleDescription: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    visitCount: 1,
    lastVisit: null,
  } as unknown as Guest,
];

describe('GuestList (privacy-first + shortcuts)', () => {
  it('does not render guest names when search is empty (privacy-first)', () => {
    render(<GuestList guests={baseGuests} isLoading={false} enableSearch />);

    expect(screen.getByText('Ready to search')).toBeInTheDocument();
    expect(screen.queryByText(/John Smith/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Jane Doe/i)).not.toBeInTheDocument();
  });

  it('renders matching guests after search input', async () => {
    const user = userEvent.setup();
    render(<GuestList guests={baseGuests} isLoading={false} enableSearch />);

    const input = screen.getByPlaceholderText('Type a name to search…');
    await user.type(input, 'john');

    expect(await screen.findByText(/John Smith/i)).toBeInTheDocument();
  });

  it('Cmd/Ctrl+K focuses the search input', async () => {
    const user = userEvent.setup();
    render(<GuestList guests={baseGuests} isLoading={false} enableSearch />);

    await user.keyboard('{Control>}{k}{/Control}');

    const input = screen.getByPlaceholderText('Type a name to search…');
    expect(input).toHaveFocus();
  });

  it('Ctrl+Alt+G opens create form when not typing', async () => {
    const user = userEvent.setup();
    const onCreateGuest = vi.fn(async () => undefined);

    render(
      <GuestList
        guests={baseGuests}
        isLoading={false}
        enableSearch
        showCreateForm
        onCreateGuest={onCreateGuest}
      />
    );

    await user.keyboard('{Control>}{Alt>}{g}{/Alt}{/Control}');

    expect(
      screen.getByRole('dialog', { name: /create new guest/i })
    ).toBeInTheDocument();
  });
});
