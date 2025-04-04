
from flask import Flask, jsonify, request, make_response
from flask_cors import CORS
import jwt
import datetime
import psycopg2
import psycopg2.extras
from functools import wraps
from werkzeug.security import check_password_hash
import os
import re
from db_config import DB_CONFIG

app = Flask(__name__)
CORS(app)

# Secret key for JWT
app.config['SECRET_KEY'] = 'coolant_management_secret_key'

# Connect to the database
def get_db_connection():
    conn = psycopg2.connect(
        host=DB_CONFIG['host'],
        database=DB_CONFIG['database'],
        user=DB_CONFIG['user'],
        password=DB_CONFIG['password'],
        port=DB_CONFIG['port']
    )
    conn.autocommit = True
    return conn

# Token required decorator
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        # Check if token is in headers
        if 'Authorization' in request.headers:
            token = request.headers['Authorization'].split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            # Decode the token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            
            # Connect to database
            conn = get_db_connection()
            cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
            
            # Get current user from decoded token
            cur.execute('SELECT * FROM user_details WHERE user_id = %s', (data['user_id'],))
            current_user = cur.fetchone()
            
            cur.close()
            conn.close()
            
            if not current_user:
                return jsonify({'message': 'User not found!'}), 401
                
        except Exception as e:
            return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

# Login route
@app.route('/api/login', methods=['POST'])
def login():
    auth = request.json
    
    if not auth or not auth.get('email') or not auth.get('password'):
        return make_response('Could not verify', 401, {'WWW-Authenticate': 'Basic realm="Login required!"'})
    
    email = auth.get('email')
    password = auth.get('password')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Find user by email
    cur.execute('SELECT * FROM user_details WHERE user_mailid = %s', (email,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return make_response('Invalid credentials', 401, {'WWW-Authenticate': 'Basic realm="Login required!"'})
    
    # Check password (in a real app, you'd use check_password_hash)
    if password == user['password']: # Simplified, don't use in production
        # Generate JWT token
        token = jwt.encode({
            'user_id': user['user_id'],
            'role': user['role'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }, app.config['SECRET_KEY'], algorithm="HS256")
        
        user_data = {
            'id': user['user_id'],
            'fullName': user['full_name'],
            'email': user['user_mailid'],
            'role': user['role'],
            'designation': user['designation'],
            'companyName': user['company'],
            'profileImage': user['profile_image']
        }
        
        cur.close()
        conn.close()
        
        return jsonify({
            'token': token,
            'user': user_data
        })
    
    cur.close()
    conn.close()
    
    return make_response('Invalid credentials', 401, {'WWW-Authenticate': 'Basic realm="Login required!"'})

# Forgot password route
@app.route('/api/forgot-password', methods=['POST'])
def forgot_password():
    data = request.json
    
    if not data or not data.get('email'):
        return jsonify({'message': 'Email is required!'}), 400
    
    email = data.get('email')
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Check if user exists
    cur.execute('SELECT * FROM user_details WHERE user_mailid = %s', (email,))
    user = cur.fetchone()
    
    if not user:
        cur.close()
        conn.close()
        return jsonify({'message': 'User not found!'}), 404
    
    # Generate reset token
    token = jwt.encode({
        'user_id': user['user_id'],
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)
    }, app.config['SECRET_KEY'], algorithm="HS256")
    
    # Store token in database
    cur.execute(
        'INSERT INTO password_reset_token (user_id, token, expires_at) VALUES (%s, %s, %s) RETURNING token_id',
        (user['user_id'], token, datetime.datetime.utcnow() + datetime.timedelta(hours=1))
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    # In a real app, send email with reset link
    reset_link = f"http://localhost:5173/reset-password/{token}"
    
    # For demo purposes, return the link
    return jsonify({
        'message': 'Password reset link sent!',
        'reset_link': reset_link
    })

# Reset password route
@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.json
    
    if not data or not data.get('token') or not data.get('password'):
        return jsonify({'message': 'Token and password are required!'}), 400
    
    token = data.get('token')
    new_password = data.get('password')
    
    try:
        # Decode token
        decoded = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
        user_id = decoded['user_id']
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if token exists and is valid
        cur.execute(
            'SELECT * FROM password_reset_token WHERE token = %s AND expires_at > %s',
            (token, datetime.datetime.utcnow())
        )
        token_data = cur.fetchone()
        
        if not token_data:
            cur.close()
            conn.close()
            return jsonify({'message': 'Invalid or expired token!'}), 400
        
        # Update user password
        cur.execute(
            'UPDATE user_details SET password = %s WHERE user_id = %s',
            (new_password, user_id)
        )
        
        # Delete used token
        cur.execute('DELETE FROM password_reset_token WHERE token = %s', (token,))
        
        conn.commit()
        cur.close()
        conn.close()
        
        return jsonify({'message': 'Password updated successfully!'})
    
    except Exception as e:
        return jsonify({'message': 'Token is invalid!', 'error': str(e)}), 400

# Get readings route
@app.route('/api/readings', methods=['GET'])
@token_required
def get_readings(current_user):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Different queries based on user role
    role = current_user['role']
    user_id = current_user['user_id']
    
    if role == 'admin' or role == 'manufacturer':
        # Admins and manufacturers can see all readings
        cur.execute('''
            SELECT r.reading_id, c.client_name, m.machine_name, 
                   u1.full_name as raised_by, u1.designation, r.status,
                   r.oil_refractometer, r.oil_ph_level, r.water_ph_level,
                   m.type_of_machine as machine_type, m.type_of_metal as metal_type,
                   r.created_at::date as date
            FROM reading r
            JOIN machine m ON r.machine_id = m.machine_id
            JOIN client c ON m.client_id = c.client_id
            JOIN user_details u1 ON r.raised_by = u1.user_id
            LEFT JOIN user_details u2 ON r.response_by = u2.user_id
            ORDER BY r.created_at DESC
        ''')
    elif role == 'manager' or role == 'distributor':
        # Managers and distributors see their readings and their employees'
        cur.execute('''
            SELECT r.reading_id, c.client_name, m.machine_name, 
                   u1.full_name as raised_by, u1.designation, r.status,
                   r.oil_refractometer, r.oil_ph_level, r.water_ph_level,
                   m.type_of_machine as machine_type, m.type_of_metal as metal_type,
                   r.created_at::date as date
            FROM reading r
            JOIN machine m ON r.machine_id = m.machine_id
            JOIN client c ON m.client_id = c.client_id
            JOIN user_details u1 ON r.raised_by = u1.user_id
            LEFT JOIN user_details u2 ON r.response_by = u2.user_id
            WHERE r.raised_by = %s OR u1.user_id IN (
                SELECT user_id FROM user_details 
                WHERE role = 'employee' AND company = (
                    SELECT company FROM user_details WHERE user_id = %s
                )
            )
            ORDER BY r.created_at DESC
        ''', (user_id, user_id))
    elif role == 'employee':
        # Employees only see their readings
        cur.execute('''
            SELECT r.reading_id, c.client_name, m.machine_name, 
                   u1.full_name as raised_by, u1.designation, r.status,
                   r.oil_refractometer, r.oil_ph_level, r.water_ph_level,
                   m.type_of_machine as machine_type, m.type_of_metal as metal_type,
                   r.created_at::date as date
            FROM reading r
            JOIN machine m ON r.machine_id = m.machine_id
            JOIN client c ON m.client_id = c.client_id
            JOIN user_details u1 ON r.raised_by = u1.user_id
            LEFT JOIN user_details u2 ON r.response_by = u2.user_id
            WHERE r.raised_by = %s
            ORDER BY r.created_at DESC
        ''', (user_id,))
    elif role == 'client':
        # Clients only see readings for their machines
        cur.execute('''
            SELECT r.reading_id, c.client_name, m.machine_name, 
                   u1.full_name as raised_by, u1.designation, r.status,
                   r.oil_refractometer, r.oil_ph_level, r.water_ph_level,
                   m.type_of_machine as machine_type, m.type_of_metal as metal_type,
                   r.created_at::date as date
            FROM reading r
            JOIN machine m ON r.machine_id = m.machine_id
            JOIN client c ON m.client_id = c.client_id
            JOIN user_details u1 ON r.raised_by = u1.user_id
            LEFT JOIN user_details u2 ON r.response_by = u2.user_id
            WHERE c.client_id = (
                SELECT client_id FROM client 
                WHERE gst_number = (
                    SELECT company FROM user_details WHERE user_id = %s
                )
            )
            ORDER BY r.created_at DESC
        ''', (user_id,))
    
    readings = cur.fetchall()
    
    # Convert to list of dicts
    result = []
    for row in readings:
        reading = {
            'id': f'R{str(row["reading_id"]).zfill(3)}',
            'clientName': row['client_name'],
            'machineName': row['machine_name'],
            'raisedBy': row['raised_by'],
            'designation': row['designation'],
            'status': row['status'],
            'oilRefractometer': row['oil_refractometer'],
            'oilPh': row['oil_ph_level'],
            'waterPh': row['water_ph_level'],
            'machineType': row['machine_type'],
            'metalType': row['metal_type'],
            'date': row['date'].isoformat() if row['date'] else None
        }
        result.append(reading)
    
    cur.close()
    conn.close()
    
    return jsonify(result)

# Add reading route
@app.route('/api/readings', methods=['POST'])
@token_required
def add_reading(current_user):
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided!'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get machine_id from unique code
    unique_code = data.get('uniqueCode')
    cur.execute('SELECT machine_id FROM machine WHERE unique_code = %s', (unique_code,))
    machine = cur.fetchone()
    
    if not machine:
        cur.close()
        conn.close()
        return jsonify({'message': 'Machine not found!'}), 404
    
    machine_id = machine[0]
    
    # Check if machine is in use
    is_machine_not_in_use = data.get('isMachineNotInUse', False)
    
    if is_machine_not_in_use:
        # Add a "Not In Use" reading
        cur.execute('''
            INSERT INTO reading 
            (machine_id, raised_by, status, created_at, updated_at) 
            VALUES (%s, %s, %s, NOW(), NOW())
            RETURNING reading_id
        ''', (machine_id, current_user['user_id'], 'Not In Use'))
    else:
        # Add a normal reading
        cur.execute('''
            INSERT INTO reading 
            (machine_id, raised_by, oil_refractometer, oil_ph_level, water_ph_level, 
             oil_top_up, water_input, status, created_at, updated_at) 
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
            RETURNING reading_id
        ''', (
            machine_id, 
            current_user['user_id'],
            data.get('oilRefractometer'),
            data.get('oilPh'),
            data.get('waterPh'),
            data.get('oilTopUp'),
            data.get('waterInput'),
            'Pending'
        ))
    
    reading_id = cur.fetchone()[0]
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Reading added successfully!',
        'reading_id': reading_id
    }), 201

# Get machines route for dropdown
@app.route('/api/machines', methods=['GET'])
@token_required
def get_machines(current_user):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Get all machines for dropdowns
    cur.execute('''
        SELECT m.machine_id, m.unique_code, m.machine_name, 
               m.type_of_machine, m.type_of_metal,
               c.client_name
        FROM machine m
        JOIN client c ON m.client_id = c.client_id
        ORDER BY m.machine_name
    ''')
    
    machines = cur.fetchall()
    
    # Convert to list of dicts
    result = []
    for row in machines:
        machine = {
            'id': row['machine_id'],
            'uniqueCode': row['unique_code'],
            'name': row['machine_name'],
            'type': row['type_of_machine'],
            'metalType': row['type_of_metal'],
            'clientName': row['client_name']
        }
        result.append(machine)
    
    cur.close()
    conn.close()
    
    return jsonify(result)

# Process reading response
@app.route('/api/readings/<int:reading_id>/response', methods=['POST'])
@token_required
def add_response(current_user, reading_id):
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided!'}), 400
    
    # Check if user is manager or distributor
    if current_user['role'] not in ['manager', 'distributor', 'admin']:
        return jsonify({'message': 'Unauthorized!'}), 403
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Update reading with response
    cur.execute('''
        UPDATE reading 
        SET response_by = %s,
            response_timestamp = NOW(),
            post_oil_refractometer = %s,
            post_oil_ph_level = %s,
            post_oil_top_up = %s,
            post_water = %s,
            post_water_ph_level = %s,
            status = 'Completed',
            updated_at = NOW()
        WHERE reading_id = %s
    ''', (
        current_user['user_id'],
        data.get('postOilRefractometer'),
        data.get('postOilPh'),
        data.get('postOilTopUp'),
        data.get('postWater'),
        data.get('postWaterPh'),
        reading_id
    ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Response added successfully!'
    })

# Delete reading
@app.route('/api/readings/<int:reading_id>', methods=['DELETE'])
@token_required
def delete_reading(current_user, reading_id):
    # Check if user is admin, manager, or distributor
    if current_user['role'] not in ['admin', 'manager', 'distributor']:
        return jsonify({'message': 'Unauthorized!'}), 403
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Delete reading
    cur.execute('DELETE FROM reading WHERE reading_id = %s', (reading_id,))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Reading deleted successfully!'
    })

# Get user profile
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    return jsonify({
        'id': current_user['user_id'],
        'fullName': current_user['full_name'],
        'email': current_user['user_mailid'],
        'role': current_user['role'],
        'designation': current_user['designation'],
        'phoneNumber': current_user['phone_number'],
        'companyName': current_user['company'],
        'profileImage': current_user['profile_image']
    })

# Update user profile
@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    data = request.json
    
    if not data:
        return jsonify({'message': 'No data provided!'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Update user profile
    cur.execute('''
        UPDATE user_details 
        SET full_name = %s,
            designation = %s,
            phone_number = %s,
            user_mailid = %s,
            company = %s,
            updated_at = NOW()
        WHERE user_id = %s
    ''', (
        data.get('fullName'),
        data.get('designation'),
        data.get('phoneNumber'),
        data.get('email'),
        data.get('companyName'),
        current_user['user_id']
    ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Profile updated successfully!'
    })

# Update user password
@app.route('/api/change-password', methods=['POST'])
@token_required
def change_password(current_user):
    data = request.json
    
    if not data or not data.get('currentPassword') or not data.get('newPassword'):
        return jsonify({'message': 'Current and new passwords are required!'}), 400
    
    current_password = data.get('currentPassword')
    new_password = data.get('newPassword')
    
    # Verify current password
    if current_password != current_user['password']:
        return jsonify({'message': 'Current password is incorrect!'}), 400
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Update password
    cur.execute('''
        UPDATE user_details 
        SET password = %s,
            updated_at = NOW()
        WHERE user_id = %s
    ''', (new_password, current_user['user_id']))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Password updated successfully!'
    })

if __name__ == '__main__':
    app.run(debug=True, port=5000)
