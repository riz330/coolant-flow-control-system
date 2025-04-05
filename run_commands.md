
# Running the Coolant Management System

This guide provides step-by-step instructions for setting up and running the Coolant Management System on your local machine.

## Prerequisites

- Visual Studio Code (VS Code)
- Node.js and npm 
- Python 3.x
- PostgreSQL (installed and running)

## Part 1: Database Setup

1. Ensure PostgreSQL is installed and running on your machine.
2. Create a new database named `coolant_management`:

```sql
CREATE DATABASE coolant_management;
```

3. Apply the DDL scripts in this order:
   - Run `backend/sql/ddl/01_create_tables.sql`
   - Run `backend/sql/ddl/02_constraints.sql` (if exists)
   - Run sample data scripts (optional)

You can run these scripts using PostgreSQL's command-line tool `psql`, pgAdmin, or any other PostgreSQL client.

## Part 2: Backend Setup

1. Open the project folder in VS Code.
2. Navigate to the `backend` directory.
3. Create a virtual environment (optional but recommended):

```bash
# On Windows
python -m venv venv
venv\Scripts\activate

# On macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

4. Install the required dependencies:

```bash
pip install -r requirements.txt

```

5. Update database connection settings:
   - Open `backend/db_config.py`
   - Modify the database connection parameters (host, database, user, password, port) to match your PostgreSQL setup

6. Start the Flask backend server:

```bash
python run.py
```

The backend server should start running on http://localhost:5000

## Part 3: Frontend Setup

1. Open a new terminal in VS Code.
2. Navigate to the project's root directory.
3. Install the required dependencies:

```bash
npm install
```

4. Start the React development server:

```bash
npm run dev
```

The frontend should start running on http://localhost:5173

## Part 4: Using the Application

1. Open your browser and navigate to http://localhost:5173/login
2. Log in using credentials from your database (stored in the `user_details` table)
3. The system will authenticate and redirect you to the dashboard according to your user role

## Troubleshooting

### Backend Issues:
- Make sure PostgreSQL is running and accessible
- Verify that database connection parameters in `db_config.py` are correct
- Check Flask server logs for errors

### Frontend Issues:
- Make sure the backend server is running before using the frontend
- Check browser console for any errors
- Verify that API calls are going to the correct endpoint (http://localhost:5000/api)

### Authentication Issues:
- Ensure the users exist in the `user_details` table
- Verify that passwords in the database match what you're entering
- Check that JWT configuration is correct in the Flask app
