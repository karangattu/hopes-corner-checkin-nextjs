import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/supabase/roles';

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

        // Get user role from users table
        const { data, error: queryError } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();

        if (queryError) {
          setError(queryError.message);
          setRole(null);
        } else if (data) {
          setRole(data.role as UserRole);
        }
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
