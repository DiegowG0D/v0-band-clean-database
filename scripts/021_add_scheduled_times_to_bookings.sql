-- Add scheduled start and end times to bookings table
-- This allows tracking estimated vs actual work hours

ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS scheduled_start_time TIME,
ADD COLUMN IF NOT EXISTS scheduled_end_time TIME;

-- Update existing bookings to have end times based on duration
UPDATE public.bookings
SET 
  scheduled_start_time = scheduled_time,
  scheduled_end_time = (scheduled_time::time + (duration_hours || ' hours')::interval)::time
WHERE scheduled_start_time IS NULL;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_start_time ON public.bookings(scheduled_start_time);
CREATE INDEX IF NOT EXISTS idx_bookings_scheduled_end_time ON public.bookings(scheduled_end_time);

-- Update the trigger to calculate earnings based on ACTUAL hours worked (from attendance_logs)
-- instead of estimated hours (from bookings)
CREATE OR REPLACE FUNCTION calculate_booking_earnings()
RETURNS TRIGGER AS $$
DECLARE
  v_payment_type VARCHAR(20);
  v_commission_rate DECIMAL(5, 4);
  v_fixed_hourly_rate DECIMAL(10, 2);
  v_actual_hours DECIMAL(5, 2);
BEGIN
  -- Get cleaner payment details
  SELECT 
    COALESCE(cd.payment_type, 'percentage'),
    COALESCE(cd.commission_rate, 0),
    COALESCE(cd.fixed_hourly_rate, 0)
  INTO 
    v_payment_type,
    v_commission_rate,
    v_fixed_hourly_rate
  FROM cleaner_details cd
  WHERE cd.user_id = NEW.cleaner_id;
  
  -- Get actual hours worked from attendance_logs for this booking
  SELECT COALESCE(SUM(total_hours), 0)
  INTO v_actual_hours
  FROM attendance_logs
  WHERE booking_id = NEW.id AND status = 'clocked_out';
  
  -- If no actual hours yet, use estimated duration_hours
  IF v_actual_hours = 0 THEN
    v_actual_hours := NEW.duration_hours;
  END IF;
  
  -- Calculate earnings based on payment type
  IF v_payment_type = 'fixed' THEN
    -- Fixed rate: cleaner gets fixed_hourly_rate * actual_hours_worked
    NEW.cleaner_earnings := v_fixed_hourly_rate * v_actual_hours;
    NEW.company_earnings := NEW.total_price - NEW.cleaner_earnings;
  ELSE
    -- Percentage: cleaner gets commission_rate% of total_price
    NEW.cleaner_earnings := NEW.total_price * v_commission_rate;
    NEW.company_earnings := NEW.total_price - NEW.cleaner_earnings;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update trigger to recalculate when attendance changes
CREATE OR REPLACE FUNCTION update_booking_on_attendance_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Recalculate booking earnings when attendance is updated
  UPDATE bookings
  SET updated_at = NOW()
  WHERE id = NEW.booking_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_booking_on_attendance ON attendance_logs;
CREATE TRIGGER trg_update_booking_on_attendance
AFTER INSERT OR UPDATE ON attendance_logs
FOR EACH ROW
WHEN (NEW.booking_id IS NOT NULL AND NEW.status = 'clocked_out')
EXECUTE FUNCTION update_booking_on_attendance_change();

COMMENT ON COLUMN bookings.scheduled_start_time IS 'Estimated start time for the service';
COMMENT ON COLUMN bookings.scheduled_end_time IS 'Estimated end time for the service';
COMMENT ON TRIGGER trg_update_booking_on_attendance ON attendance_logs IS 'Recalculates booking earnings when cleaner clocks out';
