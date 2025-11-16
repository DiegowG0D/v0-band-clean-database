-- Fix the payment calculation to properly multiply fixed_hourly_rate by duration_hours
-- This ensures cleaners get paid correctly for all hours worked

DROP TRIGGER IF EXISTS trigger_calculate_payment_split ON public.bookings;
DROP FUNCTION IF EXISTS calculate_payment_split();

-- Create improved function to calculate payment split
CREATE OR REPLACE FUNCTION calculate_payment_split()
RETURNS TRIGGER AS $$
DECLARE
  cleaner_rate DECIMAL(5, 4);
  cleaner_payment_type VARCHAR(20);
  cleaner_hourly_rate DECIMAL(10, 2);
  cleaner_total DECIMAL(10, 2);
BEGIN
  -- Only calculate if cleaner is assigned and total_price is set
  IF NEW.cleaner_id IS NOT NULL AND NEW.total_price IS NOT NULL THEN
    -- Get cleaner's payment settings
    SELECT 
      COALESCE(payment_type, 'percentage'),
      commission_rate,
      fixed_hourly_rate
    INTO 
      cleaner_payment_type,
      cleaner_rate,
      cleaner_hourly_rate
    FROM public.cleaner_details
    WHERE user_id = NEW.cleaner_id;
    
    -- Calculate based on payment type
    IF cleaner_payment_type = 'fixed' AND cleaner_hourly_rate IS NOT NULL THEN
      -- Fixed hourly rate: multiply rate by duration_hours
      cleaner_total := cleaner_hourly_rate * COALESCE(NEW.duration_hours, 0);
      NEW.cleaner_earnings := ROUND(cleaner_total, 2);
      NEW.company_earnings := ROUND(NEW.total_price - NEW.cleaner_earnings, 2);
    ELSIF cleaner_rate IS NOT NULL THEN
      -- Percentage-based: cleaner gets percentage of total_price
      NEW.cleaner_earnings := ROUND(NEW.total_price * cleaner_rate, 2);
      NEW.company_earnings := ROUND(NEW.total_price - NEW.cleaner_earnings, 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-calculate payment split on insert/update
CREATE TRIGGER trigger_calculate_payment_split
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payment_split();

-- Update existing bookings with fixed payment type to recalculate correctly
UPDATE public.bookings b
SET cleaner_earnings = ROUND(cd.fixed_hourly_rate * b.duration_hours, 2),
    company_earnings = ROUND(b.total_price - (cd.fixed_hourly_rate * b.duration_hours), 2)
FROM public.cleaner_details cd
WHERE b.cleaner_id = cd.user_id
  AND cd.payment_type = 'fixed'
  AND cd.fixed_hourly_rate IS NOT NULL
  AND b.duration_hours IS NOT NULL;
