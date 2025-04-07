
-- Create the employee_details table for the Employee Management Module

CREATE TABLE IF NOT EXISTS employee_details (
  id SERIAL PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  mobile_number VARCHAR(15) NOT NULL,
  mobile_country_code VARCHAR(10) DEFAULT '+91',
  whatsapp_number VARCHAR(15) NOT NULL,
  whatsapp_country_code VARCHAR(10) DEFAULT '+91',
  email VARCHAR(255) NOT NULL,
  employee_type VARCHAR(50) NOT NULL, -- 'Distributor' or 'Manager'
  manager_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_employee_manager_name ON employee_details(manager_name);
CREATE INDEX IF NOT EXISTS idx_employee_email ON employee_details(email);
CREATE INDEX IF NOT EXISTS idx_employee_type ON employee_details(employee_type);

-- Add constraints
ALTER TABLE employee_details
ADD CONSTRAINT employee_type_check
CHECK (employee_type IN ('Distributor', 'Manager'));

ALTER TABLE employee_details
ADD CONSTRAINT employee_mobile_check
CHECK (length(mobile_number) = 10);

ALTER TABLE employee_details
ADD CONSTRAINT employee_whatsapp_check
CHECK (length(whatsapp_number) = 10);
