
# Coolant Management System - Run Commands

This document provides the commands needed to run the Coolant Management System locally for development purposes.

## Prerequisites

Before running the application, ensure you have:

- Python 3.8+
- Node.js 14+ and npm
- PostgreSQL 12+

## Backend Setup and Run Commands

### 1. Set Up the Database

```bash
# Log in to PostgreSQL
psql -U postgres

# Create a new database
CREATE DATABASE coolant_management;

# Create a new user (optional)
CREATE USER coolant_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE coolant_management TO coolant_user;

# Exit PostgreSQL
\q
```

### 2. Configure the Backend

```bash
# Navigate to the backend directory
cd backend

# Create a virtual environment
python -m venv venv

# Activate the virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Update database configuration in db_config.py with your credentials
```

### 3. Initialize the Database with Sample Data

```bash
# Run DDL scripts
psql -U coolant_user -d coolant_management -a -f sql/ddl/01_create_tables.sql
psql -U coolant_user -d coolant_management -a -f sql/ddl/02_constraints.sql

# Load sample data
psql -U coolant_user -d coolant_management -a -f sql/sample_data.sql
```

### 4. Run the Flask Development Server

```bash
# Make sure your virtual environment is activated
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Run the development server
python run.py
```

The backend API should now be running at: http://localhost:5000/api/

## Frontend Setup and Run Commands

### 1. Install Dependencies

```bash
# Navigate to the project root
cd ../

# Install dependencies
npm install
```

### 2. Run the Development Server

```bash
# Start the development server
npm run dev
```

The frontend should now be running at: http://localhost:8080

### 3. Build for Production

```bash
# Create a production build
npm run build
```

This will create a production-ready build in the `dist` directory.

## Testing with Sample Accounts

You can log in to the application using the following sample accounts:

| Email                  | Password    | Role          |
|------------------------|-------------|---------------|
| admin@example.com      | password123 | Admin         |
| manager@example.com    | password123 | Manager       |
| distributor@example.com| password123 | Distributor   |
| employee@example.com   | password123 | Employee      |
| client@example.com     | password123 | Client        |
| manufacturer@example.com| password123| Manufacturer  |

## Troubleshooting

### Backend Issues

```bash
# Check Flask error logs
cat backend/logs/error.log

# Verify database connection
python -c "from app.utils.db import get_connection; conn = get_connection(); print('Connected successfully' if conn else 'Connection failed')"
```

### Frontend Issues

```bash
# Clear npm cache
npm cache clean --force

# Reinstall dependencies
rm -rf node_modules
npm install
```

## Additional Development Commands

```bash
# Run backend tests
cd backend
pytest

# Lint backend code
flake8 app

# Lint frontend code
npm run lint

# Run frontend tests
npm test
```
