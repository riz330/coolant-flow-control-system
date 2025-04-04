
# Coolant Management System Backend

This is the backend API for the Coolant Management System, built with Flask and PostgreSQL.

## Setup Guide

### Prerequisites
- Python 3.6 or higher
- PostgreSQL database
- pip (Python package manager)

### Step 1: Database Setup
1. Create a PostgreSQL database named `coolant_management`
2. Run the SQL scripts in the following order:
   - `sql/ddl/01_create_tables.sql` - Creates all tables
   - `sql/ddl/02_constraints.sql` - Adds constraints
   - (Optional) `sql/sample_data.sql` - Adds sample data

### Step 2: Backend Setup
1. Navigate to the backend folder
   ```
   cd backend
   ```

2. Create a virtual environment
   ```
   python -m venv venv
   ```

3. Activate the virtual environment
   - Windows:
     ```
     venv\Scripts\activate
     ```
   - macOS/Linux:
     ```
     source venv/bin/activate
     ```

4. Install dependencies
   ```
   pip install -r requirements.txt
   ```

5. Configure database connection
   Edit `db_config.py` with your PostgreSQL credentials or set the following environment variables:
   - `DB_HOST` - Database host (default: localhost)
   - `DB_NAME` - Database name (default: coolant_management)
   - `DB_USER` - Database username (default: postgres)
   - `DB_PASSWORD` - Database password (default: password)
   - `DB_PORT` - Database port (default: 5432)

### Step 3: Run the Application
1. Start the backend server
   ```
   python run.py
   ```

2. The API will be accessible at `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/login` - Login with email and password
- `POST /api/forgot-password` - Request password reset
- `POST /api/reset-password` - Reset password with token

### User Profile
- `GET /api/profile` - Get current user profile
- `PUT /api/profile/update` - Update user profile
- `POST /api/change-password` - Change user password

### Distributors
- `GET /api/distributors` - Get all distributors
- `GET /api/distributors/<id>` - Get distributor by ID
- `POST /api/distributors` - Create new distributor
- `PUT /api/distributors/<id>` - Update distributor
- `DELETE /api/distributors/<id>` - Delete distributor

## Development

### Directory Structure
- `app/` - Main application code
  - `routes/` - API route handlers
  - `utils/` - Utility functions
- `sql/` - SQL scripts
  - `ddl/` - Table definitions and constraints
- `static/` - Static files (images, etc.)
  - `distributor_logos/` - Distributor logo images
  - `user_profiles/` - User profile images

### Adding New Features
1. Create route handlers in appropriate files in `app/routes/`
2. Register new blueprints in `app/app.py`
3. Update database schema as needed in `sql/ddl/`
