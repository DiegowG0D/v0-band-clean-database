-- Update Band Clean services with correct pricing structure
-- Home & Office Cleaning €15/hour
-- Airbnb Turnover - custom value
-- Ironing Service €15/hour
-- Pet Sitting €20/hour
-- Condominium Cleaning - custom value

DELETE FROM public.services;

INSERT INTO public.services (name, description, base_price, duration_hours, is_active) VALUES
  ('Home & Office Cleaning', 'Professional cleaning for homes and offices - €15/hour', 15.00, 1.0, true),
  ('Airbnb Turnover', 'Complete cleaning and preparation for Airbnb guests - Custom value', 0.00, 1.0, true),
  ('Ironing Service', 'Professional ironing service - €15/hour', 15.00, 1.0, true),
  ('Pet Sitting', 'Professional pet care and sitting service - €20/hour', 20.00, 1.0, true),
  ('Condominium Cleaning', 'Complete condominium cleaning service - Custom value', 0.00, 1.0, true);
