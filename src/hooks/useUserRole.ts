import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/supabase/roles';

function normalizeRole(value: unknown): UserRole | null {
  if (typeof value !== 'string') return null;
  const v = value.trim().toLowerCase();
  if (v === 'admin' || v === 'board' || v === 'staff' || v === 'checkin') {
    return v as UserRole;
  }
  return null;
}

export function useUserRole() {
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchUserRole() {
      try {
        const supabase = await createClient();
        
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setRole(null);
          setLoading(false);
          return;
        }

        const metadataRole = normalizeRole(user.user_metadata?.role);

        // Get user role from users table
        const { data, error: queryError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .maybeSingle();

        if (queryError) {
          setError(queryError.message);
          setRole(metadataRole);
        }

        setRole(normalizeRole(data?.role) ?? metadataRole);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }

    fetchUserRole();
  }, []);

  return { role, loading, error };
}
