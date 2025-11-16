-- Add missing service_address column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS service_address TEXT;

-- Delete all existing services to start fresh
DELETE FROM public.services;

-- Insert correct Band Clean services with proper pricing
INSERT INTO public.services (id, name, description, base_price, duration_hours, is_active) VALUES
  (gen_random_uuid(), 'Home & Office Cleaning', 'Professional home and office cleaning service - €15/hour', 15.00, 1.0, true),
  (gen_random_uuid(), 'Airbnb Turnover', 'Complete Airbnb property turnover service - Custom pricing based on property size', 0.00, 1.0, true),
  (gen_random_uuid(), 'Ironing Service', 'Professional ironing service - €15/hour', 15.00, 1.0, true),
  (gen_random_uuid(), 'Pet Sitting', 'Pet care and sitting service - €20/hour', 20.00, 1.0, true),
  (gen_random_uuid(), 'Condominium Cleaning', 'Common area and condominium cleaning - Custom pricing', 0.00, 1.0, true);

-- Verify services were inserted
SELECT * FROM public.services ORDER BY name;
