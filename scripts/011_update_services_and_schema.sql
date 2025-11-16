-- Update services to match Band Clean specifications
-- Delete old services
DELETE FROM public.services;

-- Insert correct Band Clean services
INSERT INTO public.services (name, description, base_price, duration_hours, is_active) VALUES
  ('Home & Office Cleaning', 'Professional cleaning for homes and offices', 15.00, 1.0, true),
  ('Airbnb Turnover', 'Complete cleaning and preparation for Airbnb guests', 0.00, 1.0, true),
  ('Ironing Service', 'Professional ironing service', 15.00, 1.0, true),
  ('Pet Sitting', 'Professional pet care and sitting service', 20.00, 1.0, true),
  ('Condominium Cleaning', 'Complete condominium cleaning service', 0.00, 1.0, true);

-- Add address field to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS service_address TEXT;

-- Add comment explaining pricing
COMMENT ON COLUMN public.services.base_price IS 'Hourly rate for Home & Office Cleaning (15€), Ironing Service (15€), Pet Sitting (20€). Custom pricing for Airbnb Turnover and Condominium Cleaning (set to 0)';
