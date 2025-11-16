# Authentication Fix - RLS Recursion Issue

## Problem
The authentication system was failing with the error: `infinite recursion detected in policy for relation "users"`

## Root Cause
The Row Level Security (RLS) policies were checking if a user is an admin by querying the `users` table:
\`\`\`sql
EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin')
\`\`\`

This created an infinite loop because:
1. Query attempts to read from `users` table
2. RLS policy triggers to check permissions
3. Policy checks `users` table to verify admin role
4. This triggers RLS policy again → infinite recursion

## Solution
Created SECURITY DEFINER functions that bypass RLS checks:

\`\`\`sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
\`\`\`

### Why This Works
- `SECURITY DEFINER` executes with the privileges of the function creator (superuser)
- Bypasses RLS policies completely, avoiding recursion
- `SET search_path = public` ensures security by locking the schema search path

## Updated Policies
All RLS policies now use `public.is_admin()` instead of direct table queries:

\`\`\`sql
CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());
\`\`\`

## Changes Made
1. **scripts/008_fix_rls_recursion.sql** - Drops old policies and creates new ones with SECURITY DEFINER functions
2. **app/auth/login/page.tsx** - Removed debug logs, added proper error handling
3. **app/auth/sign-up/page.tsx** - Removed debug logs, improved validation
4. **app/auth/confirm/page.tsx** - Removed debug logs, streamlined confirmation flow

## Testing
After applying the script `008_fix_rls_recursion.sql`, users should be able to:
1. Sign up with admin or cleaner role
2. Login without recursion errors
3. Be redirected to appropriate dashboard based on role
4. Access only the data their role permits

## Security Notes
- SECURITY DEFINER functions are safe here because they only check user roles
- No data modification happens in these functions
- Search path is explicitly set to prevent SQL injection
