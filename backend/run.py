from flask import Flask, jsonify, request, make_response, send_from_directory
from flask_cors import CORS
import jwt
import datetime
import psycopg2
import psycopg2.extras
from functools import wraps
from werkzeug.security import check_password_hash
import os
import re
# from db_config import DB_CONFIG
# from db_config import get_db_connection
from db_config import get_db_connection

conn = get_db_connection()



import uuid
from werkzeug.utils import secure_filename

app = Flask(__name__)
CORS(app)

# Secret key for JWT
app.config['SECRET_KEY'] = 'coolant_management_secret_key'

# Upload folders
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'static')
CLIENT_LOGO_FOLDER = os.path.join(UPLOAD_FOLDER, 'client_logos')
DISTRIBUTOR_LOGO_FOLDER = os.path.join(UPLOAD_FOLDER, 'distributor_logos')
USER_PROFILE_FOLDER = os.path.join(UPLOAD_FOLDER, 'user_profiles')

# Create folders if they don't exist
for folder in [UPLOAD_FOLDER, CLIENT_LOGO_FOLDER, DISTRIBUTOR_LOGO_FOLDER, USER_PROFILE_FOLDER]:
    if not os.path.exists(folder):
        os.makedirs(folder)

# Allowed file extensions
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

# Connect to the database
# def get_db_connection():
#     print("DB_CONFIG:", DB_CONFIG)
#     conn = psycopg2.connect(
#         host=DB_CONFIG['host'],
#         database=DB_CONFIG['database'],
#         user=DB_CONFIG['user'],
#         password=DB_CONFIG['password'],
#         port=DB_CONFIG['port']
#     )
#     conn.autocommit = True
#     return conn

# Check if file extension is allowed
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Save uploaded file
def save_file(file, folder, filename):
    if not file:
        return None
    
    if file and allowed_file(file.filename):
        # Generate unique filename
        filename = secure_filename(filename)
        filepath = os.path.join(folder, filename)
        file.save(filepath)
        return filename
    return None

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

    # Fetch readings from the database
    cur.execute('SELECT * FROM reading')
    readings = cur.fetchall()

    # Convert readings to a list of dictionaries
    readings_list = []
    for reading in readings:
        readings_list.append({
            'reading_id': reading['reading_id'],
            'machine_id': reading['machine_id'],
            'raised_by': reading['raised_by'],
            'oil_refractometer': reading['oil_refractometer'],
            'oil_ph_level': reading['oil_ph_level'],
            'water_ph_level': reading['water_ph_level'],
            'oil_top_up': reading['oil_top_up'],
            'water_input': reading['water_input'],
            'status': reading['status'],
            'response_by': reading['response_by'],
            'response_timestamp': reading['response_timestamp'],
            'post_oil_refractometer': reading['post_oil_refractometer'],
            'post_oil_ph_level': reading['post_oil_ph_level'],
            'post_oil_top_up': reading['post_oil_top_up'],
            'post_water': reading['post_water'],
            'post_water_ph_level': reading['post_water_ph_level'],
            'created_at': reading['created_at'],
            'updated_at': reading['updated_at']
        })

    cur.close()
    conn.close()

    return jsonify(readings_list)

# Add reading route
@app.route('/api/readings', methods=['POST'])
@token_required
def add_reading(current_user):
    data = request.json

    # Extract data from the request
    machine_id = data.get('machine_id')
    oil_refractometer = data.get('oil_refractometer')
    oil_ph_level = data.get('oil_ph_level')
    water_ph_level = data.get('water_ph_level')
    oil_top_up = data.get('oil_top_up')
    water_input = data.get('water_input')
    status = data.get('status')

    conn = get_db_connection()
    cur = conn.cursor()

    # Insert the new reading into the database
    cur.execute('''
        INSERT INTO reading (machine_id, raised_by, oil_refractometer, oil_ph_level, water_ph_level, 
        oil_top_up, water_input, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
    ''', (machine_id, current_user['user_id'], oil_refractometer, oil_ph_level, water_ph_level,
          oil_top_up, water_input, status))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'message': 'Reading added successfully!'}), 201

# Get machines route for dropdown
@app.route('/api/machines', methods=['GET'])
@token_required
def get_machines(current_user):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

    # Fetch machines from the database
    cur.execute('SELECT machine_id, machine_name FROM machine')
    machines = cur.fetchall()

    # Convert machines to a list of dictionaries
    machines_list = []
    for machine in machines:
        machines_list.append({
            'machine_id': machine['machine_id'],
            'machine_name': machine['machine_name']
        })

    cur.close()
    conn.close()

    return jsonify(machines_list)

# Process reading response
@app.route('/api/readings/<int:reading_id>/response', methods=['POST'])
@token_required
def add_response(current_user, reading_id):
    data = request.json

    # Extract data from the request
    response_by = current_user['user_id']
    response_timestamp = datetime.datetime.now()
    post_oil_refractometer = data.get('post_oil_refractometer')
    post_oil_ph_level = data.get('post_oil_ph_level')
    post_oil_top_up = data.get('post_oil_top_up')
    post_water = data.get('post_water')
    post_water_ph_level = data.get('post_water_ph_level')
    status = data.get('status')

    conn = get_db_connection()
    cur = conn.cursor()

    # Update the reading with the response data
    cur.execute('''
        UPDATE reading 
        SET response_by = %s, response_timestamp = %s, 
        post_oil_refractometer = %s, post_oil_ph_level = %s, 
        post_oil_top_up = %s, post_water = %s, 
        post_water_ph_level = %s, status = %s,
        updated_at = NOW()
        WHERE reading_id = %s
    ''', (response_by, response_timestamp, post_oil_refractometer, post_oil_ph_level,
          post_oil_top_up, post_water, post_water_ph_level, status, reading_id))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'message': 'Reading response added successfully!'})

# Delete reading
@app.route('/api/readings/<int:reading_id>', methods=['DELETE'])
@token_required
def delete_reading(current_user, reading_id):
    conn = get_db_connection()
    cur = conn.cursor()

    # Delete the reading from the database
    cur.execute('DELETE FROM reading WHERE reading_id = %s', (reading_id,))

    conn.commit()
    cur.close()
    conn.close()

    return jsonify({'message': 'Reading deleted successfully!'})

# Get user profile
@app.route('/api/profile', methods=['GET'])
@token_required
def get_profile(current_user):
    # Get full user profile details from database
    profile_image = current_user['profile_image']
    if profile_image and not profile_image.startswith(('http://', 'https://')):
        profile_image = f"http://localhost:5000/static/user_profiles/{profile_image}"
    
    return jsonify({
        'id': current_user['user_id'],
        'fullName': current_user['full_name'],
        'email': current_user['user_mailid'],
        'role': current_user['role'],
        'designation': current_user['designation'],
        'phoneNumber': current_user['phone_number'],
        'companyName': current_user['company'],
        'profileImage': profile_image
    })

# Update user profile
@app.route('/api/profile', methods=['PUT'])
@token_required
def update_profile(current_user):
    # Handle file upload if present
    profile_image = None
    if 'profileImage' in request.files:
        file = request.files['profileImage']
        if file and allowed_file(file.filename):
            # Generate unique filename
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"user_{current_user['user_id']}.{ext}"
            file.save(os.path.join(USER_PROFILE_FOLDER, filename))
            profile_image = filename
    
    # Get form data
    full_name = request.form.get('fullName', current_user['full_name'])
    designation = request.form.get('designation', current_user['designation'])
    phone_number = request.form.get('phoneNumber', current_user['phone_number'])
    email = request.form.get('email', current_user['user_mailid'])
    company = request.form.get('companyName', current_user['company'])
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Update user profile
    if profile_image:
        cur.execute('''
            UPDATE user_details 
            SET full_name = %s, designation = %s, phone_number = %s,
                user_mailid = %s, company = %s, profile_image = %s,
                updated_at = NOW()
            WHERE user_id = %s
        ''', (full_name, designation, phone_number, email, company, profile_image, current_user['user_id']))
    else:
        cur.execute('''
            UPDATE user_details 
            SET full_name = %s, designation = %s, phone_number = %s,
                user_mailid = %s, company = %s, updated_at = NOW()
            WHERE user_id = %s
        ''', (full_name, designation, phone_number, email, company, current_user['user_id']))
    
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
        SET password = %s, updated_at = NOW()
        WHERE user_id = %s
    ''', (new_password, current_user['user_id']))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Password updated successfully!'
    })

# Get clients
@app.route('/api/clients', methods=['GET'])
@token_required
def get_clients(current_user):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Different queries based on user role
    role = current_user['role']
    user_id = current_user['user_id']
    
    if role == 'admin' or role == 'manufacturer':
        # Admins and manufacturers can see all clients
        cur.execute('''
            SELECT client_id, client_name, city, address, primary_contact_person,
                   CONCAT(primary_country_code, primary_mobile_number) as primary_number,
                   secondary_contact_person,
                   CONCAT(secondary_country_code, secondary_mobile_number) as secondary_number,
                   email_id, gst_number, types_of_metals, client_category,
                   CONCAT(whatsapp_country_code, whatsapp_communication_number) as whatsapp_number,
                   client_logo, distributor_id
            FROM client
            ORDER BY client_name
        ''')
    elif role == 'manager' or role == 'distributor':
        # Managers and distributors see their clients
        cur.execute('''
            SELECT client_id, client_name, city, address, primary_contact_person,
                   CONCAT(primary_country_code, primary_mobile_number) as primary_number,
                   secondary_contact_person,
                   CONCAT(secondary_country_code, secondary_mobile_number) as secondary_number,
                   email_id, gst_number, types_of_metals, client_category,
                   CONCAT(whatsapp_country_code, whatsapp_communication_number) as whatsapp_number,
                   client_logo, distributor_id
            FROM client
            WHERE created_by = %s OR distributor_id IN (
                SELECT distributor_id FROM distributor WHERE created_by = %s
            )
            ORDER BY client_name
        ''', (user_id, user_id))
    elif role == 'employee':
        # Employees see their company's clients
        cur.execute('''
            SELECT client_id, client_name, city, address, primary_contact_person,
                   CONCAT(primary_country_code, primary_mobile_number) as primary_number,
                   secondary_contact_person,
                   CONCAT(secondary_country_code, secondary_mobile_number) as secondary_number,
                   email_id, gst_number, types_of_metals, client_category,
                   CONCAT(whatsapp_country_code, whatsapp_communication_number) as whatsapp_number,
                   client_logo, distributor_id
            FROM client
            WHERE created_by = %s OR distributor_id IN (
                SELECT distributor_id FROM distributor WHERE created_by = (
                    SELECT user_id FROM user_details 
                    WHERE role IN ('manager', 'distributor') AND company = (
                        SELECT company FROM user_details WHERE user_id = %s
                    )
                )
            )
            ORDER BY client_name
        ''', (user_id, user_id))
    elif role == 'client':
        # Clients only see themselves
        cur.execute('''
            SELECT client_id, client_name, city, address, primary_contact_person,
                   CONCAT(primary_country_code, primary_mobile_number) as primary_number,
                   secondary_contact_person,
                   CONCAT(secondary_country_code, secondary_mobile_number) as secondary_number,
                   email_id, gst_number, types_of_metals, client_category,
                   CONCAT(whatsapp_country_code, whatsapp_communication_number) as whatsapp_number,
                   client_logo, distributor_id
            FROM client
            WHERE gst_number = %s
            ORDER BY client_name
        ''', (current_user['company'],))
    
    clients = cur.fetchall()
    
    # Convert to list of dicts
    result = []
    for row in clients:
        # Get proper URL for client logo
        client_logo = row['client_logo']
        if client_logo and not client_logo.startswith(('http://', 'https://')):
            client_logo = f"http://localhost:5000/static/client_logos/{client_logo}"
        
        client = {
            'id': row['client_id'],
            'client_name': row['client_name'],
            'city': row['city'],
            'address': row['address'],
            'primary_contact_person': row['primary_contact_person'],
            'primary_number': row['primary_number'],
            'secondary_contact_person': row['secondary_contact_person'] or '-',
            'secondary_number': row['secondary_number'] or '-',
            'email': row['email_id'],
            'gst_number': row['gst_number'],
            'types_of_metals': row['types_of_metals'],
            'client_category': row['client_category'],
            'whatsapp_number': row['whatsapp_number'],
            'client_logo': client_logo,
            'distributor_id': row['distributor_id']
        }
        result.append(client)
    
    cur.close()
    conn.close()
    
    return jsonify(result)

# Add new client
@app.route('/api/clients', methods=['POST'])
@token_required
def add_client(current_user):
    # Check if user has permission to add clients
    if current_user['role'] not in ['admin', 'manager', 'distributor', 'employee']:
        return jsonify({'message': 'Unauthorized!'}), 403
    
    # Handle file upload if present
    client_logo = None
    if 'client_logo' in request.files:
        file = request.files['client_logo']
        if file and allowed_file(file.filename):
            # Generate unique filename
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"client_{uuid.uuid4().hex}.{ext}"
            file.save(os.path.join(CLIENT_LOGO_FOLDER, filename))
            client_logo = filename
    
    # Get form data
    client_name = request.form.get('client_name')
    city = request.form.get('city')
    address = request.form.get('address')
    primary_contact = request.form.get('primary_contact_person')
    primary_mobile = request.form.get('primary_mobile_number')
    whatsapp_number = request.form.get('whatsapp_number')
    secondary_contact = request.form.get('secondary_contact_person', '')
    secondary_mobile = request.form.get('secondary_mobile_number', '')
    email = request.form.get('email')
    gst_number = request.form.get('gst_number')
    types_of_metals = request.form.get('types_of_metals')
    client_category = request.form.get('client_category')
    distributor_id = request.form.get('distributor_id')
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Insert new client
    cur.execute('''
        INSERT INTO client 
        (client_name, city, address, primary_contact_person, primary_country_code,
        primary_mobile_number, secondary_contact_person, secondary_country_code,
        secondary_mobile_number, email_id, gst_number, types_of_metals,
        client_category, whatsapp_country_code, whatsapp_communication_number,
        client_logo, distributor_id, created_by, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, NOW(), NOW())
        RETURNING client_id
    ''', (
        client_name, city, address, primary_contact, '+91', primary_mobile,
        secondary_contact or None, '+91' if secondary_mobile else None, secondary_mobile or None,
        email, gst_number, types_of_metals, client_category, '+91', whatsapp_number,
        client_logo, distributor_id, current_user['user_id']
    ))
    
    client_id = cur.fetchone()[0]
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Client added successfully!',
        'client_id': client_id
    }), 201

# Update client
@app.route('/api/clients/<int:client_id>', methods=['PUT'])
@token_required
def update_client(current_user, client_id):
    # Check if client exists and user has permission
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    cur.execute('SELECT * FROM client WHERE client_id = %s', (client_id,))
    client = cur.fetchone()
    
    if not client:
        cur.close()
        conn.close()
        return jsonify({'message': 'Client not found!'}), 404
    
    # Check permissions
    if current_user['role'] == 'client' and client['gst_number'] != current_user['company']:
        cur.close()
        conn.close()
        return jsonify({'message': 'Unauthorized!'}), 403
    
    # Handle file upload if present
    client_logo = client['client_logo']
    if 'client_logo' in request.files:
        file = request.files['client_logo']
        if file and allowed_file(file.filename):
            # Generate unique filename
            ext = file.filename.rsplit('.', 1)[1].lower()
            filename = f"client_{uuid.uuid4().hex}.{ext}"
            file.save(os.path.join(CLIENT_LOGO_FOLDER, filename))
            client_logo = filename
    
    # Get form data
    client_name = request.form.get('client_name', client['client_name'])
    city = request.form.get('city', client['city'])
    address = request.form.get('address', client['address'])
    primary_contact = request.form.get('primary_contact_person', client['primary_contact_person'])
    primary_mobile = request.form.get('primary_mobile_number', client['primary_mobile_number'])
    whatsapp_number = request.form.get('whatsapp_number', client['whatsapp_communication_number'])
    secondary_contact = request.form.get('secondary_contact_person', client['secondary_contact_person'])
    secondary_mobile = request.form.get('secondary_mobile_number', client['secondary_mobile_number'])
    email = request.form.get('email', client['email_id'])
    gst_number = request.form.get('gst_number', client['gst_number'])
    types_of_metals = request.form.get('types_of_metals', client['types_of_metals'])
    client_category = request.form.get('client_category', client['client_category'])
    distributor_id = request.form.get('distributor_id', client['distributor_id'])
    
    # Update client
    cur.execute('''
        UPDATE client 
        SET client_name = %s, city = %s, address = %s, primary_contact_person = %s,
            primary_mobile_number = %s, secondary_contact_person = %s, secondary_mobile_number = %s,
            email_id = %s, gst_number = %s, types_of_metals = %s, client_category = %s,
            whatsapp_communication_number = %s, client_logo = %s, distributor_id = %s,
            updated_at = NOW()
        WHERE client_id = %s
    ''', (
        client_name, city, address, primary_contact, primary_mobile,
        secondary_contact, secondary_mobile, email, gst_number, types_of_metals,
        client_category, whatsapp_number, client_logo, distributor_id, client_id
    ))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Client updated successfully!'
    })

# Delete client
@app.route('/api/clients/<int:client_id>', methods=['DELETE'])
@token_required
def delete_client(current_user, client_id):
    # Check if user has permission to delete clients
    if current_user['role'] not in ['admin', 'manager', 'distributor']:
        return jsonify({'message': 'Unauthorized!'}), 403
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Check if client exists
    cur.execute('SELECT client_logo FROM client WHERE client_id = %s', (client_id,))
    client = cur.fetchone()
    
    if not client:
        cur.close()
        conn.close()
        return jsonify({'message': 'Client not found!'}), 404
    
    # Delete client logo file if exists
    if client['client_logo']:
        try:
            file_path = os.path.join(CLIENT_LOGO_FOLDER, client['client_logo'])
            if os.path.exists(file_path):
                os.remove(file_path)
        except Exception as e:
            print(f"Error deleting file: {e}")
    
    # Delete client
    cur.execute('DELETE FROM client WHERE client_id = %s', (client_id,))
    
    conn.commit()
    cur.close()
    conn.close()
    
    return jsonify({
        'message': 'Client deleted successfully!'
    })

# Get distributors
@app.route('/api/distributors', methods=['GET'])
@token_required
def get_distributors(current_user):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    
    # Different queries based on user role
    # role =


if __name__ == '__main__':
    app.run(debug=True, port=5000)    
