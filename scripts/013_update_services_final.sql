-- Update Band Clean services to final pricing
DELETE FROM public.services;

INSERT INTO public.services (name, description, base_price, duration_hours, is_active) VALUES
  ('Home & Office Cleaning', 'Professional cleaning for homes and offices - €15 per hour', 15.00, 1.0, true),
  ('Airbnb Turnover', 'Complete cleaning and preparation for Airbnb guests - Custom pricing', 0.00, 1.0, true),
  ('Ironing Service', 'Professional ironing service - €15 per hour', 15.00, 1.0, true),
  ('Pet Sitting', 'Professional pet care and sitting service - €20 per hour', 20.00, 1.0, true),
  ('Condominium Cleaning', 'Complete condominium cleaning service - Custom pricing', 0.00, 1.0, true);
