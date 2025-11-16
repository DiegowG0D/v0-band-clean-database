-- Add payment type option to cleaner_details
-- Allows choosing between percentage-based commission or fixed hourly rate

ALTER TABLE public.cleaner_details 
ADD COLUMN IF NOT EXISTS payment_type VARCHAR(20) DEFAULT 'percentage' CHECK (payment_type IN ('percentage', 'fixed_hourly'));

ALTER TABLE public.cleaner_details 
ADD COLUMN IF NOT EXISTS fixed_hourly_rate DECIMAL(10, 2);

COMMENT ON COLUMN public.cleaner_details.payment_type IS 'Payment calculation type: percentage (% of service price) or fixed_hourly (fixed € per hour)';
COMMENT ON COLUMN public.cleaner_details.fixed_hourly_rate IS 'Fixed amount cleaner receives per hour (e.g., €8.00) - only used when payment_type is fixed_hourly';

-- Update the payment split calculation function to support both types
CREATE OR REPLACE FUNCTION calculate_payment_split()
RETURNS TRIGGER AS $$
DECLARE
  cleaner_rate DECIMAL(5, 4);
  cleaner_payment_type VARCHAR(20);
  cleaner_fixed_rate DECIMAL(10, 2);
  cleaner_total DECIMAL(10, 2);
BEGIN
  -- Only calculate if cleaner is assigned and total_price is set
  IF NEW.cleaner_id IS NOT NULL AND NEW.total_price IS NOT NULL THEN
    -- Get cleaner's payment settings
    SELECT payment_type, commission_rate, fixed_hourly_rate 
    INTO cleaner_payment_type, cleaner_rate, cleaner_fixed_rate
    FROM public.cleaner_details
    WHERE user_id = NEW.cleaner_id;
    
    -- Calculate based on payment type
    IF cleaner_payment_type = 'fixed_hourly' AND cleaner_fixed_rate IS NOT NULL AND NEW.duration_hours IS NOT NULL THEN
      -- Fixed hourly: cleaner gets fixed rate * hours worked
      cleaner_total := cleaner_fixed_rate * NEW.duration_hours;
      NEW.cleaner_earnings := ROUND(cleaner_total, 2);
      NEW.company_earnings := ROUND(NEW.total_price - NEW.cleaner_earnings, 2);
    ELSIF cleaner_payment_type = 'percentage' AND cleaner_rate IS NOT NULL THEN
      -- Percentage: cleaner gets percentage of total price
      NEW.cleaner_earnings := ROUND(NEW.total_price * cleaner_rate, 2);
      NEW.company_earnings := ROUND(NEW.total_price - NEW.cleaner_earnings, 2);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update existing cleaners to have percentage type as default
UPDATE public.cleaner_details
SET payment_type = 'percentage'
WHERE payment_type IS NULL;
