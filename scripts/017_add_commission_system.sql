-- Add commission/payment split fields to cleaner_details and bookings
-- This allows admins to define how much cleaners earn vs company earnings

-- Add commission rate to cleaner_details (e.g., 0.53 = 53% to cleaner)
ALTER TABLE public.cleaner_details 
ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5, 4) DEFAULT 0.5333 CHECK (commission_rate >= 0 AND commission_rate <= 1);

-- Add comment explaining the field
COMMENT ON COLUMN public.cleaner_details.commission_rate IS 'Percentage of booking price that goes to cleaner (e.g., 0.5333 = 53.33%, rest goes to company)';

-- Add payment split fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cleaner_earnings DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS company_earnings DECIMAL(10, 2);

-- Add comments
COMMENT ON COLUMN public.bookings.cleaner_earnings IS 'Amount that goes to the cleaner (e.g., €8)';
COMMENT ON COLUMN public.bookings.company_earnings IS 'Amount that goes to the company (remaining after cleaner payment)';

-- Create function to calculate payment split
CREATE OR REPLACE FUNCTION calculate_payment_split()
RETURNS TRIGGER AS $$
DECLARE
  cleaner_rate DECIMAL(5, 4);
BEGIN
  -- Only calculate if cleaner is assigned and total_price is set
  IF NEW.cleaner_id IS NOT NULL AND NEW.total_price IS NOT NULL THEN
    -- Get cleaner's commission rate
    SELECT commission_rate INTO cleaner_rate
    FROM public.cleaner_details
    WHERE user_id = NEW.cleaner_id;
    
    -- If cleaner has commission rate, calculate split
    IF cleaner_rate IS NOT NULL THEN
      NEW.cleaner_earnings := ROUND(NEW.total_price * cleaner_rate, 2);
      NEW.company_earnings := ROUND(NEW.total_price - NEW.cleaner_earnings, 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-calculate payment split on insert/update
DROP TRIGGER IF EXISTS trigger_calculate_payment_split ON public.bookings;
CREATE TRIGGER trigger_calculate_payment_split
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION calculate_payment_split();

-- Update existing cleaners with default commission rate (53.33% = €8 out of €15)
UPDATE public.cleaner_details
SET commission_rate = 0.5333
WHERE commission_rate IS NULL;
