-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL, -- 'booking_assigned', 'clock_in', 'clock_out', 'booking_reminder', 'info'
  related_id UUID, -- booking_id, attendance_id, etc
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at DESC);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own notifications"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to create notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id UUID,
  p_title VARCHAR,
  p_message TEXT,
  p_type VARCHAR,
  p_related_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, title, message, type, related_id)
  VALUES (p_user_id, p_title, p_message, p_type, p_related_id)
  RETURNING id INTO v_notification_id;
  
  RETURN v_notification_id;
END;
$$;

-- Trigger: Notify cleaner when assigned to booking
CREATE OR REPLACE FUNCTION notify_booking_assignment()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_customer_name VARCHAR;
  v_service_name VARCHAR;
  v_scheduled_date DATE;
BEGIN
  -- Only trigger for new assignments or changes
  IF (TG_OP = 'INSERT' AND NEW.cleaner_id IS NOT NULL) OR 
     (TG_OP = 'UPDATE' AND OLD.cleaner_id IS DISTINCT FROM NEW.cleaner_id AND NEW.cleaner_id IS NOT NULL) THEN
    
    -- Get booking details
    SELECT c.name, s.name, NEW.scheduled_date
    INTO v_customer_name, v_service_name, v_scheduled_date
    FROM public.customers c, public.services s
    WHERE c.id = NEW.customer_id AND s.id = NEW.service_id;
    
    -- Create notification for cleaner
    PERFORM create_notification(
      NEW.cleaner_id,
      'New Task Assigned',
      'You have been assigned to ' || v_service_name || ' for ' || v_customer_name || ' on ' || TO_CHAR(v_scheduled_date, 'DD/MM/YYYY'),
      'booking_assigned',
      NEW.id
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_booking_assignment
AFTER INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION notify_booking_assignment();

-- Trigger: Notify admin when cleaner clocks in/out
CREATE OR REPLACE FUNCTION notify_clock_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_cleaner_name VARCHAR;
  v_customer_name VARCHAR;
  v_admin_ids UUID[];
BEGIN
  -- Get cleaner name
  SELECT u.full_name INTO v_cleaner_name
  FROM public.users u
  WHERE u.id = NEW.cleaner_id;
  
  -- Get customer name if booking exists
  IF NEW.booking_id IS NOT NULL THEN
    SELECT c.name INTO v_customer_name
    FROM public.bookings b
    JOIN public.customers c ON b.customer_id = c.id
    WHERE b.id = NEW.booking_id;
  END IF;
  
  -- Get all admin user IDs
  SELECT ARRAY_AGG(id) INTO v_admin_ids
  FROM public.users
  WHERE role = 'admin';
  
  -- Clock In notification
  IF TG_OP = 'INSERT' AND NEW.clock_in IS NOT NULL AND NEW.clock_out IS NULL THEN
    -- Notify all admins
    FOR i IN 1..COALESCE(array_length(v_admin_ids, 1), 0) LOOP
      PERFORM create_notification(
        v_admin_ids[i],
        'Cleaner Clocked In',
        v_cleaner_name || ' clocked in' || COALESCE(' for ' || v_customer_name, ''),
        'clock_in',
        NEW.id
      );
    END LOOP;
  END IF;
  
  -- Clock Out notification
  IF TG_OP = 'UPDATE' AND OLD.clock_out IS NULL AND NEW.clock_out IS NOT NULL THEN
    -- Notify all admins
    FOR i IN 1..COALESCE(array_length(v_admin_ids, 1), 0) LOOP
      PERFORM create_notification(
        v_admin_ids[i],
        'Cleaner Clocked Out',
        v_cleaner_name || ' clocked out' || COALESCE(' from ' || v_customer_name, '') || ' - ' || NEW.total_hours || ' hours',
        'clock_out',
        NEW.id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_notify_clock_events
AFTER INSERT OR UPDATE ON public.attendance_logs
FOR EACH ROW
EXECUTE FUNCTION notify_clock_events();

-- Enable Realtime for notifications table
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
