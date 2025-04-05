
-- Sample data for Coolant Management System

-- Clear existing data (if any)
TRUNCATE password_reset_token CASCADE;
TRUNCATE reading CASCADE;
TRUNCATE machine CASCADE;
TRUNCATE client CASCADE;
TRUNCATE distributor CASCADE;
TRUNCATE user_details CASCADE;

-- Reset sequences
ALTER SEQUENCE user_details_user_id_seq RESTART WITH 1;
ALTER SEQUENCE distributor_distributor_id_seq RESTART WITH 1;
ALTER SEQUENCE client_client_id_seq RESTART WITH 1;
ALTER SEQUENCE machine_machine_id_seq RESTART WITH 1;
ALTER SEQUENCE reading_reading_id_seq RESTART WITH 1;
ALTER SEQUENCE password_reset_token_token_id_seq RESTART WITH 1;

-- Insert sample users
-- Note: In a real application, passwords would be hashed.
-- For demonstration purposes, we're using plain text passwords.
INSERT INTO user_details (username, password, full_name, user_mailid, phone_number, role, designation, company, profile_image)
VALUES 
('admin', 'password123', 'Admin User', 'admin@example.com', '9876543210', 'admin', 'System Administrator', 'Coolant Systems Inc.', 'user_profiles/default.png'),
('manufacturer', 'password123', 'Manufacturer User', 'manufacturer@example.com', '9876543211', 'manufacturer', 'Production Manager', 'Coolant Manufacturing Ltd.', 'user_profiles/default.png'),
('manager', 'password123', 'Manager User', 'manager@example.com', '9876543212', 'manager', 'Regional Manager', 'Coolant Systems Inc.', 'user_profiles/default.png'),
('distributor', 'password123', 'Distributor User', 'distributor@example.com', '9876543213', 'distributor', 'Distributor Head', 'Distribution Networks LLC', 'user_profiles/default.png'),
('employee', 'password123', 'Employee User', 'employee@example.com', '9876543214', 'employee', 'Field Technician', 'Coolant Systems Inc.', 'user_profiles/default.png'),
('client', 'password123', 'Client User', 'client@example.com', '9876543215', 'client', 'Procurement Manager', 'Client Manufacturing Co.', 'user_profiles/default.png');

-- Insert sample distributors
INSERT INTO distributor (distributor_name, city, address, primary_contact_person, primary_mobile_number, 
    secondary_contact_person, secondary_mobile_number, email_id, gst_number, distributor_category, 
    whatsapp_communication_number, distributor_logo, created_by)
VALUES 
('Midwest Distribution Co.', 'Chicago', '123 Distribution Ave, Chicago, IL 60601', 'Michael Johnson', '8765432110',
 'Sarah Williams', '8765432111', 'contact@midwest.com', 'GST8901234567', 'Wholesale',
 '8765432110', 'distributor_logos/1.png', 1),
 
('Eastern Supply Ltd.', 'New York', '456 Supply St, New York, NY 10001', 'Jessica Brown', '8765432112',
 'David Miller', '8765432113', 'contact@eastern.com', 'GST9012345678', 'Retail',
 '8765432112', 'distributor_logos/2.png', 1),
 
('Western Logistics', 'Los Angeles', '789 Logistics Blvd, Los Angeles, CA 90001', 'Robert Smith', '8765432114',
 'Amy Davis', '8765432115', 'contact@western.com', 'GST0123456789', 'Industrial',
 '8765432114', 'distributor_logos/3.png', 1),
 
('Southern Distributors Inc.', 'Houston', '101 Distribution Way, Houston, TX 77001', 'Thomas Wilson', '8765432116',
 'Emily Lee', '8765432117', 'contact@southern.com', 'GST1234567890', 'Commercial',
 '8765432116', 'distributor_logos/4.png', 1),
 
('Global Supply Chain', 'Miami', '202 Global Ave, Miami, FL 33101', 'James Garcia', '8765432118',
 'Lisa Martinez', '8765432119', 'contact@globalsupply.com', 'GST2345678901', 'Wholesale',
 '8765432118', 'distributor_logos/5.png', 1);

-- Insert sample clients
INSERT INTO client (client_name, city, address, primary_contact_person, primary_mobile_number, 
    secondary_contact_person, secondary_mobile_number, email_id, gst_number, types_of_metals, 
    client_category, whatsapp_communication_number, client_logo, distributor_id, created_by)
VALUES 
('Acme Industries', 'New York', '123 Main St, New York, NY 10001', 'John Smith', '8765432101',
 'Jane Doe', '8765432102', 'contact@acme.com', 'GST1234567890', 'Aluminum, Steel, Copper',
 'Retail', '8765432101', 'client_logos/1.png', 2, 1),
 
('TechFab Solutions', 'Chicago', '456 Tech Ave, Chicago, IL 60601', 'Emma Johnson', '8765432103',
 'Michael Williams', '8765432104', 'contact@techfab.com', 'GST2345678901', 'Steel, Titanium',
 'Wholesale', '8765432103', 'client_logos/2.png', 1, 4),
 
('Precision Manufacturing', 'Houston', '789 Precision Blvd, Houston, TX 77001', 'David Brown', '8765432105',
 'Sarah Miller', '8765432106', 'contact@precision.com', 'GST3456789012', 'Stainless Steel, Aluminum',
 'Distributor', '8765432105', 'client_logos/3.png', 4, 3),
 
('Global Machining Inc.', 'Los Angeles', '101 Global Way, Los Angeles, CA 90001', 'Robert Wilson', '8765432107',
 'Jennifer Davis', '8765432108', 'contact@globalmach.com', 'GST4567890123', 'Cast Iron, Aluminum',
 'Retail', '8765432107', 'client_logos/4.png', 3, 4),
 
('Elite Engineering', 'Miami', '202 Elite St, Miami, FL 33101', 'Thomas Anderson', '8765432109',
 'Lisa Garcia', '8765432110', 'contact@eliteeng.com', 'GST5678901234', 'Titanium, Steel',
 'Wholesale', '8765432109', 'client_logos/5.png', 5, 3);

-- Insert sample machines
INSERT INTO machine (unique_code, machine_name, type_of_machine, type_of_metal, client_id, distributor_id, created_by)
VALUES 
('CNC-M-001', 'CNC Mill XL-500', 'Mill', 'Aluminum', 1, 2, 4),
('LTH-T-002', 'Lathe TL-200', 'Lathe', 'Steel', 2, 1, 3),
('DRL-P-003', 'Drill Press DP-100', 'Drill', 'Stainless Steel', 3, 4, 3),
('GRD-G-004', 'Grinder G-300', 'Grinder', 'Cast Iron', 4, 3, 5),
('CUT-P-005', 'Plasma Cutter PC-500', 'Cutter', 'Titanium', 5, 5, 4);

-- Insert sample readings
INSERT INTO reading (machine_id, raised_by, oil_refractometer, oil_ph_level, water_ph_level, oil_top_up, water_input, status, 
    response_by, response_timestamp, post_oil_refractometer, post_oil_ph_level, post_oil_top_up, post_water, post_water_ph_level)
VALUES 
(1, 5, 5.2, 7.3, 6.8, 1.5, 2.0, 'Pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(2, 5, 4.8, 7.1, 6.9, 1.2, 1.8, 'Completed', 3, CURRENT_TIMESTAMP - INTERVAL '2 days', 5.0, 7.2, 1.0, 1.5, 7.0),
(3, 5, 5.5, 7.4, 6.7, 1.7, 2.2, 'Pending', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(4, 5, NULL, NULL, NULL, NULL, NULL, 'Not In Use', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
(5, 5, 5.0, 7.2, 6.8, 1.4, 1.9, 'Completed', 4, CURRENT_TIMESTAMP - INTERVAL '4 days', 5.2, 7.3, 1.2, 1.6, 6.9);

-- Insert a sample password reset token (expires in 24 hours)
INSERT INTO password_reset_token (user_id, token, expires_at)
VALUES (6, 'sample-reset-token-123456', CURRENT_TIMESTAMP + INTERVAL '24 hours');
