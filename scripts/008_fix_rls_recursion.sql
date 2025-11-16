-- Drop all existing policies to recreate them without recursion
DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
DROP POLICY IF EXISTS "Cleaners can view their own details" ON public.cleaner_details;
DROP POLICY IF EXISTS "Admins can view all cleaner details" ON public.cleaner_details;
DROP POLICY IF EXISTS "Admins can manage cleaner details" ON public.cleaner_details;
DROP POLICY IF EXISTS "Admins can manage customers" ON public.customers;
DROP POLICY IF EXISTS "Everyone can view services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;
DROP POLICY IF EXISTS "Cleaners can view their assigned bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON public.bookings;
DROP POLICY IF EXISTS "Cleaners can view their own attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Cleaners can insert their own attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Cleaners can update their own attendance" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admins can manage all attendance logs" ON public.attendance_logs;
DROP POLICY IF EXISTS "Admins can manage payments" ON public.payments;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;

-- Create helper function to check if user is admin (SECURITY DEFINER avoids recursion)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create helper function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (SELECT role FROM public.users WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Users table policies (fixed to avoid recursion)
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete users"
  ON public.users FOR DELETE
  USING (public.is_admin());

-- Cleaner details policies
CREATE POLICY "Cleaners can view their own details"
  ON public.cleaner_details FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all cleaner details"
  ON public.cleaner_details FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage cleaner details"
  ON public.cleaner_details FOR ALL
  USING (public.is_admin());

-- Customers policies (admin only)
CREATE POLICY "Admins can manage customers"
  ON public.customers FOR ALL
  USING (public.is_admin());

-- Services policies (everyone can view, only admins can modify)
CREATE POLICY "Everyone can view active services"
  ON public.services FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can view all services"
  ON public.services FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert services"
  ON public.services FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update services"
  ON public.services FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete services"
  ON public.services FOR DELETE
  USING (public.is_admin());

-- Bookings policies
CREATE POLICY "Cleaners can view their assigned bookings"
  ON public.bookings FOR SELECT
  USING (cleaner_id = auth.uid());

CREATE POLICY "Admins can view all bookings"
  ON public.bookings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update bookings"
  ON public.bookings FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete bookings"
  ON public.bookings FOR DELETE
  USING (public.is_admin());

-- Attendance logs policies
CREATE POLICY "Cleaners can view their own attendance"
  ON public.attendance_logs FOR SELECT
  USING (cleaner_id = auth.uid());

CREATE POLICY "Cleaners can insert their own attendance"
  ON public.attendance_logs FOR INSERT
  WITH CHECK (cleaner_id = auth.uid());

CREATE POLICY "Cleaners can update their own attendance"
  ON public.attendance_logs FOR UPDATE
  USING (cleaner_id = auth.uid());

CREATE POLICY "Admins can view all attendance logs"
  ON public.attendance_logs FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can manage all attendance logs"
  ON public.attendance_logs FOR ALL
  USING (public.is_admin());

-- Payments policies (admin only)
CREATE POLICY "Admins can view payments"
  ON public.payments FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert payments"
  ON public.payments FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update payments"
  ON public.payments FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete payments"
  ON public.payments FOR DELETE
  USING (public.is_admin());

-- Audit logs policies (admin only, read-only)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.is_admin());
