
# Database configuration settings
import os
import psycopg2

DB_CONFIG = {
    'host': os.environ.get('DB_HOST', 'localhost'),
    'database': os.environ.get('DB_NAME', 'coolant_management'),
    'user': os.environ.get('DB_USER', 'postgres'),
    'password': os.environ.get('DB_PASSWORD', 'password'),
    'port': int(os.environ.get('DB_PORT', 5432))
}

def get_db_connection():
    """
    Create and return a database connection using the configured parameters.
    """
    try:
        conn = psycopg2.connect(
            host=DB_CONFIG['host'],
            database=DB_CONFIG['database'],
            user=DB_CONFIG['user'],
            password=DB_CONFIG['password'],
            port=DB_CONFIG['port']
        )
        return conn
    except Exception as e:
        print(f"Database connection error: {e}")
        raise
