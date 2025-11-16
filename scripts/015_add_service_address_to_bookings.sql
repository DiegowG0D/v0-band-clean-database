-- Add service_address column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS service_address TEXT;

COMMENT ON COLUMN public.bookings.service_address IS 'Address where the service will be performed';
