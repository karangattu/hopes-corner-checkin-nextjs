import { createClient } from '@/lib/supabase/client';
import { UserRole } from '@/lib/supabase/roles';

export interface UserWithRole {
  id: string;
  email: string;
  role: UserRole;
  created_at: string;
}

/**
 * Fetch all users with their roles
 */
export async function fetchAllUsers(): Promise<UserWithRole[]> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch users: ${error.message}`);
  }

  return data || [];
}

/**
 * Update a user's role
 */
export async function updateUserRole(
  userId: string,
  newRole: UserRole
): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to update user role: ${error.message}`);
  }
}

/**
 * Delete a user by ID
 */
export async function removeUser(userId: string): Promise<void> {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);

  if (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

/**
 * Get a user's current role
 */
export async function getUserRoleById(userId: string): Promise<UserRole | null> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', userId)
    .single();

  if (error) {
    return null;
  }

  return data?.role || null;
}
