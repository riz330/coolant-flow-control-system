
-- Create tables for Coolant Management System

-- Create user_roles enum type
CREATE TYPE user_role AS ENUM ('admin', 'manufacturer', 'manager', 'distributor', 'employee', 'client');

-- User table
CREATE TABLE user_details (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL, -- Store hashed passwords
    full_name VARCHAR(100) NOT NULL,
    user_mailid VARCHAR(100) NOT NULL UNIQUE,
    phone_number VARCHAR(20),
    role user_role NOT NULL,
    designation VARCHAR(100),
    company VARCHAR(100),
    profile_image VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Distributor table
CREATE TABLE distributor (
    distributor_id SERIAL PRIMARY KEY,
    distributor_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    primary_contact_person VARCHAR(100) NOT NULL,
    primary_country_code VARCHAR(5) DEFAULT '+91',
    primary_mobile_number VARCHAR(15) NOT NULL,
    secondary_contact_person VARCHAR(100),
    secondary_country_code VARCHAR(5) DEFAULT '+91',
    secondary_mobile_number VARCHAR(15),
    email_id VARCHAR(100) NOT NULL,
    gst_number VARCHAR(20) NOT NULL UNIQUE,
    distributor_category VARCHAR(50) NOT NULL,
    whatsapp_country_code VARCHAR(5) DEFAULT '+91',
    whatsapp_communication_number VARCHAR(15) NOT NULL,
    distributor_logo VARCHAR(255),
    created_by INT REFERENCES user_details(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Client table
CREATE TABLE client (
    client_id SERIAL PRIMARY KEY,
    client_name VARCHAR(100) NOT NULL,
    city VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    primary_contact_person VARCHAR(100) NOT NULL,
    primary_country_code VARCHAR(5) DEFAULT '+91',
    primary_mobile_number VARCHAR(15) NOT NULL,
    secondary_contact_person VARCHAR(100),
    secondary_country_code VARCHAR(5) DEFAULT '+91',
    secondary_mobile_number VARCHAR(15),
    email_id VARCHAR(100) NOT NULL,
    gst_number VARCHAR(20) NOT NULL UNIQUE,
    types_of_metals TEXT NOT NULL, -- Comma-separated list
    client_category VARCHAR(50) NOT NULL,
    whatsapp_country_code VARCHAR(5) DEFAULT '+91',
    whatsapp_communication_number VARCHAR(15) NOT NULL,
    client_logo VARCHAR(255),
    distributor_id INT REFERENCES distributor(distributor_id),
    created_by INT REFERENCES user_details(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Machine table
CREATE TABLE machine (
    machine_id SERIAL PRIMARY KEY,
    unique_code VARCHAR(50) NOT NULL UNIQUE,
    machine_name VARCHAR(100) NOT NULL,
    type_of_machine VARCHAR(50) NOT NULL,
    type_of_metal VARCHAR(50) NOT NULL,
    client_id INT REFERENCES client(client_id),
    distributor_id INT REFERENCES distributor(distributor_id),
    created_by INT REFERENCES user_details(user_id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create reading_status enum type
CREATE TYPE reading_status AS ENUM ('Pending', 'Completed', 'Not In Use');

-- Reading table
CREATE TABLE reading (
    reading_id SERIAL PRIMARY KEY,
    machine_id INT REFERENCES machine(machine_id),
    raised_by INT REFERENCES user_details(user_id) NOT NULL,
    oil_refractometer FLOAT,
    oil_ph_level FLOAT,
    water_ph_level FLOAT,
    oil_top_up FLOAT,
    water_input FLOAT,
    status reading_status NOT NULL,
    response_by INT REFERENCES user_details(user_id),
    response_timestamp TIMESTAMP WITH TIME ZONE,
    post_oil_refractometer FLOAT,
    post_oil_ph_level FLOAT,
    post_oil_top_up FLOAT,
    post_water FLOAT,
    post_water_ph_level FLOAT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Password reset tokens
CREATE TABLE password_reset_token (
    token_id SERIAL PRIMARY KEY,
    user_id INT REFERENCES user_details(user_id) NOT NULL,
    token VARCHAR(100) NOT NULL UNIQUE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for each table
CREATE TRIGGER update_user_timestamp
BEFORE UPDATE ON user_details
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_distributor_timestamp
BEFORE UPDATE ON distributor
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_client_timestamp
BEFORE UPDATE ON client
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_machine_timestamp
BEFORE UPDATE ON machine
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();

CREATE TRIGGER update_reading_timestamp
BEFORE UPDATE ON reading
FOR EACH ROW
EXECUTE PROCEDURE update_timestamp();
