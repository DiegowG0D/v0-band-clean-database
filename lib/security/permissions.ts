// Role-based access control utilities
import { createClient } from '@/lib/supabase/server';

export type UserRole = 'admin' | 'cleaner';

interface User {
  id: string;
  role: UserRole;
  email: string;
}

// Get current user with role verification
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();
  
  const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !authUser) {
    return null;
  }

  const { data: user, error: userError } = await supabase
    .from('users')
    .select('id, role, email')
    .eq('id', authUser.id)
    .single();

  if (userError || !user) {
    return null;
  }

  return user as User;
}

// Verify user has required role
export async function requireRole(role: UserRole | UserRole[]): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    throw new Error('Unauthorized: No user found');
  }

  const allowedRoles = Array.isArray(role) ? role : [role];
  
  if (!allowedRoles.includes(user.role)) {
    throw new Error(`Forbidden: Required role ${allowedRoles.join(' or ')}`);
  }

  return user;
}

// Check if user can access resource
export async function canAccessResource(
  resourceUserId: string
): Promise<boolean> {
  const user = await getCurrentUser();

  if (!user) {
    return false;
  }

  // Admins can access everything
  if (user.role === 'admin') {
    return true;
  }

  // Users can only access their own resources
  return user.id === resourceUserId;
}
