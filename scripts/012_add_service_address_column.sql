-- Add service_address column to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS service_address TEXT;

-- Update comment
COMMENT ON COLUMN bookings.service_address IS 'Address where the service will be performed';
