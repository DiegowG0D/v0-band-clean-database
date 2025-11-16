-- Additional security enhancements

-- Create function to automatically log audit trail
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
  -- Only log for important tables
  IF TG_TABLE_NAME IN ('bookings', 'users', 'payments') THEN
    INSERT INTO public.audit_logs (
      user_id,
      action,
      table_name,
      record_id,
      old_data,
      new_data
    ) VALUES (
      auth.uid(),
      TG_OP,
      TG_TABLE_NAME,
      COALESCE(NEW.id, OLD.id),
      CASE WHEN TG_OP = 'DELETE' THEN row_to_json(OLD) ELSE NULL END,
      CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN row_to_json(NEW) ELSE NULL END
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit logging to critical tables
CREATE TRIGGER audit_bookings
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Prevent SQL injection by validating email format
ALTER TABLE public.users
  ADD CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- Add constraint to prevent negative prices
ALTER TABLE public.bookings
  ADD CONSTRAINT positive_price CHECK (total_price >= 0);

ALTER TABLE public.services
  ADD CONSTRAINT positive_base_price CHECK (base_price >= 0);

ALTER TABLE public.payments
  ADD CONSTRAINT positive_amount CHECK (amount_paid >= 0);

-- Prevent clock out before clock in
ALTER TABLE public.attendance_logs
  ADD CONSTRAINT valid_clock_times CHECK (
    clock_out IS NULL OR clock_out > clock_in
  );

-- Ensure scheduled dates are not in the past (more than 1 day old)
ALTER TABLE public.bookings
  ADD CONSTRAINT valid_scheduled_date CHECK (
    scheduled_date >= CURRENT_DATE - INTERVAL '1 day'
  );

-- Create index for faster role-based queries
CREATE INDEX idx_users_role ON public.users(role);
CREATE INDEX idx_bookings_cleaner_id ON public.bookings(cleaner_id);
CREATE INDEX idx_attendance_cleaner_status ON public.attendance_logs(cleaner_id, status);

-- Add function to prevent multiple active clock-ins
CREATE OR REPLACE FUNCTION check_single_clock_in()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'clocked_in' THEN
    IF EXISTS (
      SELECT 1 FROM public.attendance_logs
      WHERE cleaner_id = NEW.cleaner_id
        AND status = 'clocked_in'
        AND id != NEW.id
    ) THEN
      RAISE EXCEPTION 'Cleaner already has an active clock-in';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER prevent_multiple_clock_ins
  BEFORE INSERT OR UPDATE ON public.attendance_logs
  FOR EACH ROW EXECUTE FUNCTION check_single_clock_in();

-- Add rate limiting table for API abuse prevention (optional)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier TEXT NOT NULL,
  endpoint TEXT NOT NULL,
  request_count INTEGER DEFAULT 1,
  window_start TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_rate_limits_lookup ON public.rate_limits(identifier, endpoint, window_start);

-- Clean up old rate limit entries (keep last 24 hours)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;
