'use server';

import { createClient, getUserRole, updateUserRole, deleteUser } from '@/lib/supabase/server';
import { UserRole } from '@/lib/supabase/roles';

/**
 * Server action to update a user's role (admin only)
 */
export async function updateUserRoleAction(
  targetUserId: string,
  newRole: UserRole
) {
  const adminRole = await getUserRole();
  
  // Only admins can update roles
  if (adminRole !== 'admin') {
    return { error: 'Unauthorized: Only admins can update user roles' };
  }

  const error = await updateUserRole(targetUserId, newRole);
  
  if (error) {
    return { error: `Failed to update role: ${error.message}` };
  }

  return { success: true };
}

/**
 * Server action to delete a user (admin only)
 */
export async function deleteUserAction(userId: string) {
  const adminRole = await getUserRole();
  
  // Only admins can delete users
  if (adminRole !== 'admin') {
    return { error: 'Unauthorized: Only admins can delete users' };
  }

  const error = await deleteUser(userId);
  
  if (error) {
    return { error: `Failed to delete user: ${error.message}` };
  }

  return { success: true };
}

/**
 * Server action to get all users (admin only)
 */
export async function getAllUsersAction() {
  const adminRole = await getUserRole();
  
  // Only admins can view all users
  if (adminRole !== 'admin') {
    return { error: 'Unauthorized: Only admins can view all users', data: null };
  }

  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return { error: `Failed to fetch users: ${error.message}`, data: null };
  }

  return { success: true, data };
}
