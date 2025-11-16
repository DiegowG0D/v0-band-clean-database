-- Add delay tracking to attendance_logs
ALTER TABLE public.attendance_logs 
ADD COLUMN IF NOT EXISTS delay_minutes INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_delayed BOOLEAN DEFAULT false;

-- Create index for delayed attendance queries
CREATE INDEX IF NOT EXISTS idx_attendance_logs_is_delayed ON public.attendance_logs(is_delayed);

-- Function to calculate and track delays
CREATE OR REPLACE FUNCTION calculate_clock_in_delay()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_scheduled_datetime TIMESTAMP WITH TIME ZONE;
  v_actual_clock_in TIMESTAMP WITH TIME ZONE;
  v_delay_minutes INTEGER;
  v_customer_name VARCHAR;
  v_admin_ids UUID[];
  v_cleaner_name VARCHAR;
BEGIN
  -- Only calculate delay on INSERT (initial clock in)
  IF TG_OP = 'INSERT' AND NEW.booking_id IS NOT NULL THEN
    
    -- Get scheduled datetime from booking
    SELECT 
      (b.scheduled_date + b.scheduled_time)::TIMESTAMP WITH TIME ZONE,
      c.name
    INTO v_scheduled_datetime, v_customer_name
    FROM public.bookings b
    JOIN public.customers c ON b.customer_id = c.id
    WHERE b.id = NEW.booking_id;
    
    -- Calculate delay in minutes
    v_actual_clock_in := NEW.clock_in;
    v_delay_minutes := EXTRACT(EPOCH FROM (v_actual_clock_in - v_scheduled_datetime)) / 60;
    
    -- If delayed by more than 15 minutes, mark as delayed
    IF v_delay_minutes > 15 THEN
      NEW.delay_minutes := v_delay_minutes;
      NEW.is_delayed := true;
      
      -- Get cleaner name
      SELECT full_name INTO v_cleaner_name
      FROM public.users
      WHERE id = NEW.cleaner_id;
      
      -- Get all admin IDs
      SELECT ARRAY_AGG(id) INTO v_admin_ids
      FROM public.users
      WHERE role = 'admin';
      
      -- Notify all admins about the delay
      FOR i IN 1..COALESCE(array_length(v_admin_ids, 1), 0) LOOP
        PERFORM create_notification(
          v_admin_ids[i],
          'Late Clock In - ' || v_cleaner_name,
          v_cleaner_name || ' clocked in ' || v_delay_minutes || ' minutes late for ' || v_customer_name,
          'clock_in_delay',
          NEW.id
        );
      END LOOP;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for delay calculation
DROP TRIGGER IF EXISTS trigger_calculate_clock_in_delay ON public.attendance_logs;
CREATE TRIGGER trigger_calculate_clock_in_delay
BEFORE INSERT ON public.attendance_logs
FOR EACH ROW
EXECUTE FUNCTION calculate_clock_in_delay();

-- Update existing attendance logs to calculate delays (for historical data)
-- This will only work if bookings have scheduled times
UPDATE public.attendance_logs al
SET 
  delay_minutes = EXTRACT(EPOCH FROM (
    al.clock_in - (b.scheduled_date + b.scheduled_time)::TIMESTAMP WITH TIME ZONE
  )) / 60,
  is_delayed = CASE 
    WHEN EXTRACT(EPOCH FROM (
      al.clock_in - (b.scheduled_date + b.scheduled_time)::TIMESTAMP WITH TIME ZONE
    )) / 60 > 15 THEN true
    ELSE false
  END
FROM public.bookings b
WHERE al.booking_id = b.id
  AND al.delay_minutes = 0
  AND b.scheduled_time IS NOT NULL;
