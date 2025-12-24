import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@supabase/supabase-js';
import { MainNav } from '../MainNav';

const mockUsePathname = vi.fn();

vi.mock('next/navigation', () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: vi.fn(), refresh: vi.fn() }),
}));

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({ auth: { signOut: vi.fn() } }),
}));

const baseUser: User = {
  id: 'user-1',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
  email: 'user@example.com',
  phone: '',
  role: 'authenticated',
  confirmed_at: new Date().toISOString(),
  email_confirmed_at: new Date().toISOString(),
  last_sign_in_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

describe('MainNav role-based tabs', () => {
  beforeEach(() => {
    mockUsePathname.mockReturnValue('/check-in');
  });

  it('shows only Check In for checkin role', () => {
    render(<MainNav user={baseUser} role="checkin" />);

    expect(screen.getAllByRole('link', { name: 'Check In' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Services' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('shows Check In and Services for staff role', () => {
    render(<MainNav user={baseUser} role="staff" />);

    expect(screen.getAllByRole('link', { name: 'Check In' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Services' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Dashboard' })).not.toBeInTheDocument();
  });

  it('shows Check In, Services, and Dashboard for admin role', () => {
    render(<MainNav user={baseUser} role="admin" />);

    expect(screen.getAllByRole('link', { name: 'Check In' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Services' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThan(0);
  });

  it('shows only Dashboard for board role', () => {
    render(<MainNav user={baseUser} role="board" />);

    expect(screen.getAllByRole('link', { name: 'Dashboard' }).length).toBeGreaterThan(0);
    expect(screen.queryByRole('link', { name: 'Check In' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Services' })).not.toBeInTheDocument();
  });
});
