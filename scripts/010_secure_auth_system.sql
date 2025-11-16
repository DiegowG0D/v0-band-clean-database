-- CRITICAL SECURITY FIX: Remove ability to create admin accounts from frontend
-- Only allow cleaner registration from public, admins must be created by other admins

-- Drop and recreate the trigger to only allow cleaner role from sign up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create function that ONLY creates cleaners from public sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- SECURITY: Force role to be 'cleaner' for all public sign ups
  -- Admins can only be created through the admin panel or direct SQL
  user_role := 'cleaner';
  
  -- Insert into public.users table with cleaner role
  INSERT INTO public.users (id, email, role, full_name, phone)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', '')
  );
  
  -- Always create cleaner_details for new users
  INSERT INTO public.cleaner_details (user_id, hourly_rate, hire_date, status)
  VALUES (
    NEW.id,
    15.00, -- default hourly rate
    CURRENT_DATE,
    'active'
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create initial admin account (change password after first login!)
-- This creates the admin user directly in auth.users and public.users
DO $$
DECLARE
  admin_user_id UUID;
BEGIN
  -- Check if admin already exists
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE email = 'admin@bandclean.com') THEN
    -- Generate a new UUID for the admin
    admin_user_id := gen_random_uuid();
    
    -- Insert admin into public.users table
    INSERT INTO public.users (id, email, role, full_name, phone, created_at, updated_at)
    VALUES (
      admin_user_id,
      'admin@bandclean.com',
      'admin',
      'System Administrator',
      '+351 900 000 000',
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Admin user created in public.users with ID: %', admin_user_id;
    RAISE NOTICE 'IMPORTANT: You must create this user in Supabase Authentication with email: admin@bandclean.com and password: Admin123!';
    RAISE NOTICE 'Or run the sign-up from frontend and then manually update the role to admin';
  END IF;
END $$;

-- Create function for admins to create new users (both admin and cleaner)
CREATE OR REPLACE FUNCTION public.admin_create_user(
  p_email TEXT,
  p_full_name TEXT,
  p_role TEXT,
  p_phone TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID;
  v_result JSONB;
BEGIN
  -- Security check: only admins can call this function
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid() AND role = 'admin') THEN
    RAISE EXCEPTION 'Only administrators can create new users';
  END IF;

  -- Validate role
  IF p_role NOT IN ('admin', 'cleaner') THEN
    RAISE EXCEPTION 'Invalid role. Must be either admin or cleaner';
  END IF;

  -- Generate new user ID
  v_user_id := gen_random_uuid();

  -- Insert into public.users
  INSERT INTO public.users (id, email, role, full_name, phone)
  VALUES (v_user_id, p_email, p_role, p_full_name, p_phone);

  -- If cleaner, create cleaner_details
  IF p_role = 'cleaner' THEN
    INSERT INTO public.cleaner_details (user_id, hourly_rate, hire_date, status)
    VALUES (v_user_id, 15.00, CURRENT_DATE, 'active');
  END IF;

  -- Log the action
  INSERT INTO public.audit_logs (table_name, record_id, action, performed_by, changes)
  VALUES (
    'users',
    v_user_id,
    'CREATE',
    auth.uid(),
    jsonb_build_object(
      'email', p_email,
      'role', p_role,
      'full_name', p_full_name,
      'created_by', 'admin_panel'
    )
  );

  v_result := jsonb_build_object(
    'user_id', v_user_id,
    'email', p_email,
    'role', p_role,
    'message', 'User created successfully. They need to complete sign up at the registration page.'
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users (will be checked inside function)
GRANT EXECUTE ON FUNCTION public.admin_create_user TO authenticated;

COMMENT ON FUNCTION public.admin_create_user IS 'Allows administrators to create new users (admin or cleaner) through the admin panel';
