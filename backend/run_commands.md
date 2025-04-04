
# Coolant Management System - Local Development Guide

This document provides step-by-step commands to set up and run the Coolant Management System locally in VS Code.

## Prerequisites

- VS Code installed
- Node.js (v14 or higher)
- Python 3.7+
- PostgreSQL 12+
- Git

## 1. Setup Database

### 1.1 PostgreSQL Setup
1. Install PostgreSQL if not already installed
2. Create a new database:
   ```sql
   CREATE DATABASE coolant_management;
   ```
3. Run the DDL scripts in this order:
   - Execute `backend/sql/ddl/01_create_tables.sql`
   - Execute `backend/sql/ddl/02_constraints.sql`

### 1.2 Configure Database Connection
Edit `backend/db_config.py` with your PostgreSQL credentials or set the following environment variables:
- `DB_HOST` - Database host (default: localhost)
- `DB_NAME` - Database name (default: coolant_management)
- `DB_USER` - Database username (default: postgres)
- `DB_PASSWORD` - Database password (default: password)
- `DB_PORT` - Database port (default: 5432)

## 2. Setup Backend

### 2.1 Open VS Code
```
code .
```

### 2.2 Open Terminal in VS Code
Press `` Ctrl+` `` to open the integrated terminal

### 2.3 Setup Python Environment
```bash
cd backend
python -m venv venv

# Activate virtual environment
# On Windows:
venv\Scripts\activate
# On macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 2.4 Create Required Directories
```bash
mkdir -p static/distributor_logos
mkdir -p static/user_profiles
```

### 2.5 Run Backend Server
```bash
python run.py
```
The backend server will start on http://localhost:5000

## 3. Setup Frontend

### 3.1 Open a New Terminal in VS Code
Press `` Ctrl+Shift+` `` to open a new terminal

### 3.2 Install Frontend Dependencies
```bash
npm install
```

### 3.3 Run Frontend Development Server
```bash
npm run dev
```
The frontend application will start on http://localhost:5173

## 4. Testing the Application

### 4.1 Login
- Open http://localhost:5173 in your browser
- Login using credentials from the database
  - Look for users in the `user_details` table
  - Default users with different roles should be available 

### 4.2 API Testing
You can test the API endpoints directly using tools like:
- VS Code's REST Client extension
- Postman
- curl commands

Example API request with curl:
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"admin123"}'
```

## 5. Common Issues and Fixes

### 5.1 Database Connection Issues
```
Error: Connection refused
```
- Check if PostgreSQL is running
- Verify your database credentials in `db_config.py`
- Make sure the database exists

### 5.2 CORS Issues
If you see CORS errors in the browser console:
- Verify the backend is running on the expected URL
- Check for any network issues

### 5.3 Missing Dependencies
If you get module not found errors:
- Ensure you've activated the virtual environment
- Check that all dependencies are installed:
  ```bash
  pip install -r requirements.txt
  npm install
  ```

### 5.4 Port Already in Use
```
Error: Address already in use
```
- Check for other applications using port 5000 or 5173
- Change the port in the configuration if needed

## 6. Development Workflow

1. Make backend changes in the `backend` directory
2. Test API changes using tools like Postman
3. Make frontend changes in the `src` directory
4. See live updates in the browser
5. Commit changes once functionality is verified

## 7. Sample Database Records

To check if your database connection is working properly, try running:

```sql
SELECT * FROM user_details LIMIT 5;
```

You should see user records if your database is properly set up.
