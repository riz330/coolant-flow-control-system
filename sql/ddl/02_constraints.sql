
-- Add constraints to the database

-- User table foreign key constraints
ALTER TABLE user_details
ADD CONSTRAINT user_role_check
CHECK (role IN ('admin', 'manufacturer', 'manager', 'distributor', 'employee', 'client'));

-- Distributor table constraints
ALTER TABLE distributor
ADD CONSTRAINT distributor_category_check
CHECK (distributor_category IN ('Wholesale', 'Retail', 'Industrial', 'Commercial'));

ALTER TABLE distributor
ADD CONSTRAINT distributor_primary_mobile_check
CHECK (length(primary_mobile_number) = 10);

ALTER TABLE distributor
ADD CONSTRAINT distributor_secondary_mobile_check
CHECK (secondary_mobile_number IS NULL OR length(secondary_mobile_number) = 10);

ALTER TABLE distributor
ADD CONSTRAINT distributor_whatsapp_check
CHECK (length(whatsapp_communication_number) = 10);

-- Client table constraints
ALTER TABLE client
ADD CONSTRAINT client_category_check
CHECK (client_category IN ('Retail', 'Wholesale', 'Distributor'));

ALTER TABLE client
ADD CONSTRAINT client_primary_mobile_check
CHECK (length(primary_mobile_number) = 10);

ALTER TABLE client
ADD CONSTRAINT client_secondary_mobile_check
CHECK (secondary_mobile_number IS NULL OR length(secondary_mobile_number) = 10);

ALTER TABLE client
ADD CONSTRAINT client_whatsapp_check
CHECK (length(whatsapp_communication_number) = 10);

-- Machine table constraints
ALTER TABLE machine
ADD CONSTRAINT machine_type_check
CHECK (type_of_machine IN ('Mill', 'Lathe', 'Drill', 'Grinder', 'Cutter', 'Press', 'Other'));

-- Reading table constraints
ALTER TABLE reading
ADD CONSTRAINT reading_status_check
CHECK (status IN ('Pending', 'Completed', 'Not In Use'));

-- Add null constraints based on reading status
ALTER TABLE reading
ADD CONSTRAINT reading_null_check
CHECK (
    (status = 'Not In Use' AND oil_refractometer IS NULL AND oil_ph_level IS NULL AND water_ph_level IS NULL) OR
    (status != 'Not In Use' AND oil_refractometer IS NOT NULL AND oil_ph_level IS NOT NULL AND water_ph_level IS NOT NULL)
);

-- Add constraint for response data
ALTER TABLE reading
ADD CONSTRAINT reading_response_check
CHECK (
    (response_by IS NULL AND response_timestamp IS NULL) OR
    (response_by IS NOT NULL AND response_timestamp IS NOT NULL)
);

-- Add constraint for completed readings
ALTER TABLE reading
ADD CONSTRAINT reading_completed_check
CHECK (
    (status != 'Completed') OR
    (status = 'Completed' AND post_oil_refractometer IS NOT NULL AND post_oil_ph_level IS NOT NULL)
);

-- Password reset token constraints
ALTER TABLE password_reset_token
ADD CONSTRAINT token_expiry_check
CHECK (expires_at > created_at);
