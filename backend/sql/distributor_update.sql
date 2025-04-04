
-- Update distributor table to add new fields

-- Add website field
ALTER TABLE distributor ADD COLUMN IF NOT EXISTS website VARCHAR(255);

-- Add state field
ALTER TABLE distributor ADD COLUMN IF NOT EXISTS state VARCHAR(50) NOT NULL DEFAULT 'Maharashtra';

-- Add pincode field
ALTER TABLE distributor ADD COLUMN IF NOT EXISTS pincode VARCHAR(10) NOT NULL DEFAULT '400001';

-- Update constraints for phone numbers
ALTER TABLE distributor DROP CONSTRAINT IF EXISTS distributor_primary_mobile_check;
ALTER TABLE distributor DROP CONSTRAINT IF EXISTS distributor_secondary_mobile_check;
ALTER TABLE distributor DROP CONSTRAINT IF EXISTS distributor_whatsapp_check;

-- Add new constraints for phone numbers
ALTER TABLE distributor
ADD CONSTRAINT distributor_primary_mobile_check
CHECK (length(primary_mobile_number) <= 15);

ALTER TABLE distributor
ADD CONSTRAINT distributor_secondary_mobile_check
CHECK (secondary_mobile_number IS NULL OR length(secondary_mobile_number) <= 15);

ALTER TABLE distributor
ADD CONSTRAINT distributor_whatsapp_check
CHECK (length(whatsapp_communication_number) <= 15);
