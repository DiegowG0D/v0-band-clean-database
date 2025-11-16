-- Row Level Security Policies
-- Admin users can see and modify everything
-- Cleaner users can only see and modify their own data

-- Users table policies
CREATE POLICY "Users can view their own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can insert users"
  ON public.users FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update their own profile"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can update all users"
  ON public.users FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Cleaner details policies
CREATE POLICY "Cleaners can view their own details"
  ON public.cleaner_details FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all cleaner details"
  ON public.cleaner_details FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage cleaner details"
  ON public.cleaner_details FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers policies (admin only)
CREATE POLICY "Admins can manage customers"
  ON public.customers FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Services policies (everyone can view, only admins can modify)
CREATE POLICY "Everyone can view services"
  ON public.services FOR SELECT
  USING (is_active = true OR EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  ));

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Bookings policies
CREATE POLICY "Cleaners can view their assigned bookings"
  ON public.bookings FOR SELECT
  USING (
    cleaner_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage all bookings"
  ON public.bookings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

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

CREATE POLICY "Admins can manage all attendance logs"
  ON public.attendance_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Payments policies (admin only)
CREATE POLICY "Admins can manage payments"
  ON public.payments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Audit logs policies (admin only, read-only)
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
