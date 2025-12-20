import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  );
}

// Helper to get user session on server
export async function getSession() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session;
}

// Helper to get user on server
export async function getUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Helper to get user role from the users table
export async function getUserRole(): Promise<string | null> {
  const supabase = await createClient();
  const user = await getUser();
  
  if (!user) return null;
  
  // Try to get role from users table first
  const { data, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();
  
  if (!error && data) {
    return data.role;
  }
  
  // Fallback to user metadata
  return user.user_metadata?.role || null;
}

// Helper to create a user record with role
export async function createUserWithRole(
  userId: string,
  email: string,
  role: string = 'checkin'
) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('users')
    .insert([
      {
        id: userId,
        email,
        role,
        created_at: new Date().toISOString(),
      },
    ]);
  
  return error;
}

// Helper to update user role
export async function updateUserRole(userId: string, newRole: string) {
  const supabase = await createClient();
  
  const { error } = await supabase
    .from('users')
    .update({ role: newRole })
    .eq('id', userId);
  
  return error;
}

// Helper to get all users with their roles
export async function getAllUsers() {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data, error };
}

// Helper to delete a user (soft delete or hard delete)
export async function deleteUser(userId: string) {
  const supabase = await createClient();
  
  // Delete from users table
  const { error } = await supabase
    .from('users')
    .delete()
    .eq('id', userId);
  
  return error;
}
