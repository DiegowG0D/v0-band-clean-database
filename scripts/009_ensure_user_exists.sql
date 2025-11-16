-- Function to ensure user exists in public.users table
-- This will be called during login to sync auth.users with public.users

CREATE OR REPLACE FUNCTION public.ensure_user_exists(
  user_id UUID,
  user_email TEXT,
  user_metadata JSONB DEFAULT '{}'::JSONB
)
RETURNS JSONB AS $$
DECLARE
  user_role TEXT;
  user_full_name TEXT;
  user_phone TEXT;
  result JSONB;
BEGIN
  -- Extract metadata with defaults
  user_role := COALESCE(user_metadata->>'role', 'cleaner');
  user_full_name := COALESCE(user_metadata->>'full_name', '');
  user_phone := COALESCE(user_metadata->>'phone', '');

  -- Insert or update user in public.users
  INSERT INTO public.users (id, email, role, full_name, phone, created_at, updated_at)
  VALUES (
    user_id,
    user_email,
    user_role,
    user_full_name,
    user_phone,
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = NOW();

  -- If user is a cleaner and doesn't have cleaner_details, create it
  IF user_role = 'cleaner' THEN
    INSERT INTO public.cleaner_details (user_id, hourly_rate, hire_date, status, created_at, updated_at)
    VALUES (
      user_id,
      15.00, -- default hourly rate
      CURRENT_DATE,
      'active',
      NOW(),
      NOW()
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;

  -- Return user data
  SELECT jsonb_build_object(
    'id', u.id,
    'email', u.email,
    'role', u.role,
    'full_name', u.full_name
  ) INTO result
  FROM public.users u
  WHERE u.id = user_id;

  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.ensure_user_exists(UUID, TEXT, JSONB) TO authenticated;

-- Also fix the trigger to handle existing users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();
