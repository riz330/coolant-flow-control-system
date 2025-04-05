
-- Create employee_details table for the Employee Management module

CREATE TABLE IF NOT EXISTS employee_details (
  id SERIAL PRIMARY KEY,
  employee_name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  mobile_number VARCHAR(15) NOT NULL,
  mobile_country_code VARCHAR(10) DEFAULT '+91',
  whatsapp_number VARCHAR(15) NOT NULL,
  whatsapp_country_code VARCHAR(10) DEFAULT '+91',
  email VARCHAR(255) NOT NULL UNIQUE,
  employee_type VARCHAR(50) NOT NULL, -- 'Distributor' or 'Manager'
  manager_name VARCHAR(255),
  category VARCHAR(100) DEFAULT 'General',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Add index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_employee_email ON employee_details(email);

-- Add index on manager_name for manager-based filtering
CREATE INDEX IF NOT EXISTS idx_employee_manager ON employee_details(manager_name);

-- Add index on employee_type for type-based filtering
CREATE INDEX IF NOT EXISTS idx_employee_type ON employee_details(employee_type);

-- Add index on category for category-based filtering
CREATE INDEX IF NOT EXISTS idx_employee_category ON employee_details(category);
