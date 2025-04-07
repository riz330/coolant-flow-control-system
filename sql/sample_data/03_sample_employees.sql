
-- Sample data for employee_details table

INSERT INTO employee_details (
    employee_name, 
    address, 
    mobile_number, 
    mobile_country_code, 
    whatsapp_number, 
    whatsapp_country_code, 
    email, 
    employee_type, 
    manager_name, 
    category
) VALUES 
('John Smith', '123 Main St, Mumbai, Maharashtra', '9876543210', '+91', '9876543210', '+91', 'john.smith@example.com', 'Manager', NULL, 'Sales'),
('Priya Sharma', '456 Park Avenue, Delhi', '9876543211', '+91', '9876543211', '+91', 'priya.sharma@example.com', 'Manager', NULL, 'Operations'),
('Rahul Patel', '789 Business Park, Bangalore', '9876543212', '+91', '9876543212', '+91', 'rahul.patel@example.com', 'Distributor', 'John Smith', 'Marketing'),
('Ananya Singh', '321 Tech Lane, Hyderabad', '9876543213', '+91', '9876543214', '+91', 'ananya.singh@example.com', 'Distributor', 'Priya Sharma', 'Sales'),
('Vikram Mehta', '654 Industrial Area, Chennai', '9876543215', '+91', '9876543215', '+91', 'vikram.mehta@example.com', 'Manager', NULL, 'Technical'),
('Aisha Khan', '987 Residential Colony, Kolkata', '9876543216', '+91', '9876543216', '+91', 'aisha.khan@example.com', 'Distributor', 'Vikram Mehta', 'Support'),
('Arjun Reddy', '159 Corporate Hub, Pune', '9876543217', '+91', '9876543217', '+91', 'arjun.reddy@example.com', 'Distributor', 'John Smith', 'Sales'),
('Neha Gupta', '753 Commerce Center, Ahmedabad', '9876543218', '+91', '9876543218', '+91', 'neha.gupta@example.com', 'Manager', NULL, 'Finance'),
('Raj Malhotra', '852 Trade Zone, Jaipur', '9876543219', '+91', '9876543219', '+91', 'raj.malhotra@example.com', 'Distributor', 'Neha Gupta', 'Accounts'),
('Kavita Nair', '963 Business District, Lucknow', '9876543220', '+91', '9876543220', '+91', 'kavita.nair@example.com', 'Distributor', 'Priya Sharma', 'HR'),
('Samuel Johnson', '147 Downtown, Bengaluru', '9876543221', '+91', '9876543221', '+91', 'samuel.johnson@example.com', 'Manager', NULL, 'Product'),
('Deepak Verma', '258 Uptown, Indore', '9876543222', '+91', '9876543223', '+91', 'deepak.verma@example.com', 'Distributor', 'Samuel Johnson', 'Design');
