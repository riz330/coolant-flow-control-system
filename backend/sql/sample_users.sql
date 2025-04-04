
-- Sample Users for Testing
-- Note: Passwords are stored in plain text for development purposes only
-- In production, please use hashed passwords

-- Admin User
INSERT INTO user_details (username, password, full_name, user_mailid, phone_number, role, designation, company)
VALUES ('admin', 'admin123', 'Admin User', 'admin@coolant.com', '9876543210', 'admin', 'Administrator', 'Coolant Systems Ltd')
ON CONFLICT (username) DO NOTHING;

-- Manufacturer User
INSERT INTO user_details (username, password, full_name, user_mailid, phone_number, role, designation, company)
VALUES ('manufacturer', 'mfg123', 'Manufacturing Manager', 'manufacturer@coolant.com', '9876543211', 'manufacturer', 'Manufacturing Head', 'Coolant Systems Ltd')
ON CONFLICT (username) DO NOTHING;

-- Manager User
INSERT INTO user_details (username, password, full_name, user_mailid, phone_number, role, designation, company)
VALUES ('manager', 'mgr123', 'Regional Manager', 'manager@coolant.com', '9876543212', 'manager', 'Regional Manager', 'Coolant Systems Ltd')
ON CONFLICT (username) DO NOTHING;

-- Distributor User
INSERT INTO user_details (username, password, full_name, user_mailid, phone_number, role, designation, company)
VALUES ('distributor', 'dist123', 'Distributor User', 'distributor@example.com', '9876543213', 'distributor', 'Distributor', 'XYZ Distributors')
ON CONFLICT (username) DO NOTHING;

-- Employee User
INSERT INTO user_details (username, password, full_name, user_mailid, phone_number, role, designation, company)
VALUES ('employee', 'emp123', 'Field Employee', 'employee@coolant.com', '9876543214', 'employee', 'Field Technician', 'Coolant Systems Ltd')
ON CONFLICT (username) DO NOTHING;

-- Client User
INSERT INTO user_details (username, password, full_name, user_mailid, phone_number, role, designation, company)
VALUES ('client', 'client123', 'Client User', 'client@company.com', '9876543215', 'client', 'Maintenance Manager', 'ABC Industries')
ON CONFLICT (username) DO NOTHING;

-- Sample Distributor Data
INSERT INTO distributor (
    distributor_name, city, state, pincode, address, website,
    primary_contact_person, primary_country_code, primary_mobile_number,
    secondary_contact_person, secondary_country_code, secondary_mobile_number,
    email_id, gst_number, distributor_category,
    whatsapp_country_code, whatsapp_communication_number,
    created_by
)
VALUES (
    'ABC Distributors', 'Mumbai', 'Maharashtra', '400001', '123 Main St, Andheri East', 'https://abcdistributors.com',
    'John Doe', '+91', '9876543210',
    'Jane Smith', '+91', '9876543211',
    'contact@abcdistributors.com', 'GSTIN12345ABCDE', 'Wholesale',
    '+91', '9876543210',
    1
)
ON CONFLICT DO NOTHING;

INSERT INTO distributor (
    distributor_name, city, state, pincode, address, website,
    primary_contact_person, primary_country_code, primary_mobile_number,
    secondary_contact_person, secondary_country_code, secondary_mobile_number,
    email_id, gst_number, distributor_category,
    whatsapp_country_code, whatsapp_communication_number,
    created_by
)
VALUES (
    'XYZ Industrial Supplies', 'Delhi', 'Delhi', '110001', '456 Industrial Area, Phase 2', 'https://xyzsupplies.com',
    'Rahul Kumar', '+91', '9876543220',
    'Priya Sharma', '+91', '9876543221',
    'info@xyzsupplies.com', 'GSTIN98765XYZAB', 'Industrial',
    '+91', '9876543220',
    1
)
ON CONFLICT DO NOTHING;

INSERT INTO distributor (
    distributor_name, city, state, pincode, address, website,
    primary_contact_person, primary_country_code, primary_mobile_number,
    secondary_contact_person, secondary_country_code, secondary_mobile_number,
    email_id, gst_number, distributor_category,
    whatsapp_country_code, whatsapp_communication_number,
    created_by
)
VALUES (
    'City Retail Solutions', 'Bangalore', 'Karnataka', '560001', '789 Tech Park, Whitefield', 'https://cityretail.in',
    'Arun Patel', '+91', '9876543230',
    'Neha Gupta', '+91', '9876543231',
    'sales@cityretail.in', 'GSTIN55555CITYRT', 'Retail',
    '+91', '9876543230',
    2
)
ON CONFLICT DO NOTHING;
