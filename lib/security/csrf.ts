// CSRF protection utilities
import { createClient } from '@/lib/supabase/server';

// Generate a CSRF token for forms
export async function generateCsrfToken(): Promise<string> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('No active session');
  }

  // Use session ID as part of token generation
  const token = Buffer.from(
    `${session.user.id}-${Date.now()}-${Math.random()}`
  ).toString('base64');

  return token;
}

// Verify CSRF token
export async function verifyCsrfToken(token: string): Promise<boolean> {
  try {
    const decoded = Buffer.from(token, 'base64').toString('utf-8');
    const parts = decoded.split('-');
    
    if (parts.length !== 3) {
      return false;
    }

    const [userId, timestamp] = parts;
    const tokenAge = Date.now() - parseInt(timestamp);
    
    // Token expires after 1 hour
    if (tokenAge > 3600000) {
      return false;
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return user?.id === userId;
  } catch {
    return false;
  }
}
