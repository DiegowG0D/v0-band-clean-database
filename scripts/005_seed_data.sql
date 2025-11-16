-- Seed data for Band Clean

-- Insert sample services
INSERT INTO public.services (name, description, base_price, duration_hours, is_active) VALUES
  ('Basic House Cleaning', 'Standard cleaning service including dusting, vacuuming, and mopping', 50.00, 2.0, true),
  ('Deep Cleaning', 'Thorough cleaning including all areas, appliances, and hard-to-reach spots', 120.00, 4.0, true),
  ('Office Cleaning', 'Professional office space cleaning service', 80.00, 3.0, true),
  ('Move In/Out Cleaning', 'Complete cleaning for moving in or out of a property', 150.00, 5.0, true),
  ('Window Cleaning', 'Professional window cleaning service', 40.00, 1.5, true),
  ('Carpet Cleaning', 'Deep carpet cleaning and stain removal', 70.00, 2.5, true)
ON CONFLICT DO NOTHING;

-- Insert sample customers
INSERT INTO public.customers (name, email, phone, address, city, postal_code, country, notes) VALUES
  ('João Silva', 'joao.silva@email.com', '+351 912 345 678', 'Rua das Flores, 123', 'Lisboa', '1000-001', 'Portugal', 'Prefers morning appointments'),
  ('Maria Santos', 'maria.santos@email.com', '+351 913 456 789', 'Avenida da República, 456', 'Porto', '4000-001', 'Portugal', 'Has a pet dog'),
  ('Pedro Costa', 'pedro.costa@email.com', '+351 914 567 890', 'Praça do Comércio, 789', 'Lisboa', '1100-001', 'Portugal', NULL),
  ('Ana Rodrigues', 'ana.rodrigues@email.com', '+351 915 678 901', 'Rua de Santa Catarina, 321', 'Porto', '4000-002', 'Portugal', 'Large apartment - 3 bedrooms'),
  ('Carlos Ferreira', 'carlos.ferreira@email.com', '+351 916 789 012', 'Avenida dos Aliados, 654', 'Porto', '4000-003', 'Portugal', NULL)
ON CONFLICT DO NOTHING;
