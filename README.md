
# Coolant Management System - Backend Setup

This document provides instructions for setting up the Flask backend for the Coolant Management System.

## Project Structure

```
backend/
├── app/
│   ├── __init__.py             # Flask application factory
│   ├── config.py               # Configuration settings
│   ├── models/                 # Database models
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── client.py
│   │   ├── distributor.py
│   │   ├── machine.py
│   │   └── reading.py
│   ├── routes/                 # API routes
│   │   ├── __init__.py
│   │   ├── auth.py
│   │   ├── client.py
│   │   ├── distributor.py
│   │   ├── machine.py
│   │   └── reading.py
│   ├── services/               # Business logic
│   │   ├── __init__.py
│   │   ├── auth_service.py
│   │   ├── client_service.py
│   │   ├── distributor_service.py
│   │   ├── machine_service.py
│   │   └── reading_service.py
│   └── utils/                  # Utility functions
│       ├── __init__.py
│       ├── db.py               # Database connection logic
│       ├── auth.py             # JWT authentication functions
│       └── file_handler.py     # File upload/storage utilities
├── migrations/                 # Database migrations
├── sql/                        # SQL scripts
│   ├── ddl/                    # DDL statements
│   │   ├── 01_create_tables.sql
│   │   └── 02_constraints.sql
│   └── sample_data.sql         # Initial sample data
├── tests/                      # Unit and integration tests
├── .gitignore
├── requirements.txt
├── db_config.py                # Database configuration (needs customization)
├── run.py                      # Application entry point
└── deployment_guide.md         # Deployment instructions
```

## Prerequisites

- Python 3.8+
- PostgreSQL 12+
- pip (Python package manager)

## Installation

1. **Clone the repository** (if you haven't already):
   ```bash
   git clone <repository-url>
   cd <repository-directory>/backend
   ```

2. **Create a virtual environment**:
   ```bash
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   - On Windows:
     ```bash
     venv\Scripts\activate
     ```
   - On macOS/Linux:
     ```bash
     source venv/bin/activate
     ```

4. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

5. **Configure the database connection**:
   - Edit `db_config.py` with your PostgreSQL credentials:
     ```python
     # Database configuration settings
     DB_CONFIG = {
         'host': 'localhost',  # Replace with your PostgreSQL host
         'database': 'coolant_management',  # Replace with your database name
         'user': 'postgres',  # Replace with your database username
         'password': 'password',  # Replace with your database password
         'port': 5432  # Default PostgreSQL port
     }
     ```

6. **Initialize the database**:
   - Create a new PostgreSQL database named `coolant_management`
   - Run the SQL scripts in the `sql/ddl/` directory to create the tables
   - Run `sql/sample_data.sql` to populate initial data

## Running the Application

1. **Start the Flask server**:
   ```bash
   python run.py
   ```

2. **Access the API**:
   - The API will be available at: `http://localhost:5000/api/`
   - Swagger documentation: `http://localhost:5000/api/docs`

## Authentication

- The backend uses JWT (JSON Web Tokens) for authentication
- To access protected endpoints, include the JWT token in the Authorization header:
  ```
  Authorization: Bearer <token>
  ```

## Sample User Accounts

The database is pre-populated with the following sample accounts:

| Email                  | Password    | Role          |
|------------------------|-------------|---------------|
| admin@example.com      | admin123    | Admin         |
| manager@example.com    | manager123  | Manager       |
| distributor@example.com| dist123     | Distributor   |
| employee@example.com   | emp123      | Employee      |
| client@example.com     | client123   | Client        |
| manufacturer@example.com| manu123    | Manufacturer  |

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - Register new user (admin only)
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password with token

### Clients
- `GET /api/clients` - Get all clients
- `GET /api/clients/<id>` - Get client by ID
- `POST /api/clients` - Create new client
- `PUT /api/clients/<id>` - Update client
- `DELETE /api/clients/<id>` - Delete client

### Distributors
- `GET /api/distributors` - Get all distributors
- `GET /api/distributors/<id>` - Get distributor by ID
- `POST /api/distributors` - Create new distributor
- `PUT /api/distributors/<id>` - Update distributor
- `DELETE /api/distributors/<id>` - Delete distributor

### Machines
- `GET /api/machines` - Get all machines
- `GET /api/machines/<id>` - Get machine by ID
- `POST /api/machines` - Create new machine
- `PUT /api/machines/<id>` - Update machine
- `DELETE /api/machines/<id>` - Delete machine

### Readings
- `GET /api/readings` - Get all readings
- `GET /api/readings/<id>` - Get reading by ID
- `POST /api/readings` - Create new reading
- `PUT /api/readings/<id>` - Update reading
- `DELETE /api/readings/<id>` - Delete reading
- `POST /api/readings/<id>/response` - Add response to reading
- `POST /api/readings/<id>/post-reading` - Add post-reading data

## Error Handling

The API returns standard HTTP status codes:

- `200 OK` - Request succeeded
- `201 Created` - Resource created successfully
- `400 Bad Request` - Invalid request
- `401 Unauthorized` - Authentication required
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

## Deployment

See `deployment_guide.md` for instructions on deploying the application to AWS VM.
