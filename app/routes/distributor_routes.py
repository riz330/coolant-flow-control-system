
import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from werkzeug.utils import secure_filename
import jwt
from db_config import get_db_connection
from ..utils.auth_utils import token_required, role_required

distributor_bp = Blueprint('distributor', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_FILE_SIZE = 2 * 1024 * 1024  # 2MB

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@distributor_bp.route('/api/distributors', methods=['GET'])
@token_required
def get_distributors():
    conn = get_db_connection()
    cur = conn.cursor()
    
    search = request.args.get('search', '')
    category = request.args.get('category', '')
    city = request.args.get('city', '')
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    offset = (page - 1) * per_page
    
    # Base query
    query = """
        SELECT distributor_id, distributor_name, city, address, primary_contact_person,
        CONCAT(primary_country_code, primary_mobile_number) AS primary_number,
        secondary_contact_person,
        CONCAT(secondary_country_code, secondary_mobile_number) AS secondary_number,
        email_id, gst_number, distributor_category,
        CONCAT(whatsapp_country_code, whatsapp_communication_number) AS whatsapp_number,
        distributor_logo, created_by
        FROM public.distributor
        WHERE 1=1
    """
    
    count_query = "SELECT COUNT(*) FROM public.distributor WHERE 1=1"
    params = []
    
    # Add search condition if provided
    if search:
        search_condition = """ AND (
            distributor_name ILIKE %s 
            OR city ILIKE %s 
            OR gst_number ILIKE %s
        )"""
        query += search_condition
        count_query += search_condition
        search_param = f"%{search}%"
        params.extend([search_param, search_param, search_param])
    
    # Add category filter if provided
    if category:
        category_condition = " AND distributor_category = %s"
        query += category_condition
        count_query += category_condition
        params.append(category)
    
    # Add city filter if provided
    if city:
        city_condition = " AND city = %s"
        query += city_condition
        count_query += city_condition
        params.append(city)
    
    # Get total count for pagination
    cur.execute(count_query, params)
    total_count = cur.fetchone()[0]
    
    # Add pagination
    query += " ORDER BY distributor_name LIMIT %s OFFSET %s"
    params.extend([per_page, offset])
    
    cur.execute(query, params)
    distributors = cur.fetchall()
    
    result = []
    for row in distributors:
        result.append({
            'distributor_id': row[0],
            'distributor_name': row[1],
            'city': row[2],
            'address': row[3],
            'primary_contact_person': row[4],
            'primary_number': row[5],
            'secondary_contact_person': row[6],
            'secondary_number': row[7],
            'email_id': row[8],
            'gst_number': row[9],
            'distributor_category': row[10],
            'whatsapp_number': row[11],
            'distributor_logo': row[12],
            'created_by': row[13]
        })
    
    # Get distinct categories for filter dropdown
    cur.execute("SELECT DISTINCT distributor_category FROM public.distributor ORDER BY distributor_category")
    categories = [row[0] for row in cur.fetchall()]
    
    # Get distinct cities for filter dropdown
    cur.execute("SELECT DISTINCT city FROM public.distributor ORDER BY city")
    cities = [row[0] for row in cur.fetchall()]
    
    cur.close()
    conn.close()
    
    return jsonify({
        'distributors': result,
        'total_count': total_count,
        'total_pages': (total_count + per_page - 1) // per_page,
        'current_page': page,
        'categories': categories,
        'cities': cities
    })

@distributor_bp.route('/api/distributor/<int:distributor_id>', methods=['GET'])
@token_required
def get_distributor(distributor_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT distributor_id, distributor_name, city, address, primary_contact_person,
        primary_country_code, primary_mobile_number,
        secondary_contact_person, secondary_country_code, secondary_mobile_number,
        email_id, gst_number, distributor_category,
        whatsapp_country_code, whatsapp_communication_number,
        distributor_logo, created_by
        FROM public.distributor WHERE distributor_id = %s
    """, (distributor_id,))
    
    row = cur.fetchone()
    
    if not row:
        return jsonify({'error': 'Distributor not found'}), 404
    
    distributor = {
        'distributor_id': row[0],
        'distributor_name': row[1],
        'city': row[2],
        'address': row[3],
        'primary_contact_person': row[4],
        'primary_country_code': row[5],
        'primary_mobile_number': row[6],
        'secondary_contact_person': row[7],
        'secondary_country_code': row[8] or '+91',
        'secondary_mobile_number': row[9] or '',
        'email_id': row[10],
        'gst_number': row[11],
        'distributor_category': row[12],
        'whatsapp_country_code': row[13],
        'whatsapp_communication_number': row[14],
        'distributor_logo': row[15],
        'created_by': row[16]
    }
    
    cur.close()
    conn.close()
    
    return jsonify(distributor)

@distributor_bp.route('/api/distributors', methods=['POST'])
@token_required
def add_distributor():
    token = request.headers.get('Authorization').split(" ")[1]
    data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
    created_by = data['id']
    
    data = request.form.to_dict()
    
    # Validate required fields
    required_fields = [
        'distributor_name', 'city', 'address', 'primary_contact_person',
        'primary_country_code', 'primary_mobile_number', 'email_id',
        'gst_number', 'distributor_category', 'whatsapp_country_code',
        'whatsapp_communication_number'
    ]
    
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
    
    # Handle optional fields
    if 'secondary_contact_person' not in data:
        data['secondary_contact_person'] = None
    if 'secondary_country_code' not in data:
        data['secondary_country_code'] = None
    if 'secondary_mobile_number' not in data:
        data['secondary_mobile_number'] = None
    
    # Process logo file if provided
    logo_path = None
    if 'distributor_logo' in request.files:
        file = request.files['distributor_logo']
        if file and file.filename and allowed_file(file.filename):
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                return jsonify({'error': 'File size exceeds the 2MB limit'}), 400
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            filename = f"distributor_{uuid.uuid4().hex}.{filename.rsplit('.', 1)[1].lower()}"
            
            # Ensure directory exists
            upload_folder = os.path.join(current_app.static_folder, 'distributor_logos')
            os.makedirs(upload_folder, exist_ok=True)
            
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            logo_path = f'/static/distributor_logos/{filename}'
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    try:
        cur.execute("""
            INSERT INTO public.distributor (
                distributor_name, city, address, primary_contact_person,
                primary_country_code, primary_mobile_number,
                secondary_contact_person, secondary_country_code, secondary_mobile_number,
                email_id, gst_number, distributor_category,
                whatsapp_country_code, whatsapp_communication_number,
                distributor_logo, created_by, created_at, updated_at
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING distributor_id
        """, (
            data['distributor_name'], data['city'], data['address'],
            data['primary_contact_person'], data['primary_country_code'], data['primary_mobile_number'],
            data['secondary_contact_person'], data['secondary_country_code'], data['secondary_mobile_number'],
            data['email_id'], data['gst_number'], data['distributor_category'],
            data['whatsapp_country_code'], data['whatsapp_communication_number'],
            logo_path, created_by, datetime.now(), datetime.now()
        ))
        
        distributor_id = cur.fetchone()[0]
        conn.commit()
        
        return jsonify({
            'message': 'Distributor added successfully',
            'distributor_id': distributor_id
        })
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cur.close()
        conn.close()

@distributor_bp.route('/api/distributor/<int:distributor_id>', methods=['PUT'])
@token_required
def update_distributor(distributor_id):
    data = request.form.to_dict()
    
    # Validate required fields
    required_fields = [
        'distributor_name', 'city', 'address', 'primary_contact_person',
        'primary_country_code', 'primary_mobile_number', 'email_id',
        'gst_number', 'distributor_category', 'whatsapp_country_code',
        'whatsapp_communication_number'
    ]
    
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return jsonify({'error': f'Missing required fields: {", ".join(missing_fields)}'}), 400
    
    # Handle optional fields
    if 'secondary_contact_person' not in data:
        data['secondary_contact_person'] = None
    if 'secondary_country_code' not in data:
        data['secondary_country_code'] = None
    if 'secondary_mobile_number' not in data:
        data['secondary_mobile_number'] = None
    
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get current distributor data to check permissions and existing logo
    token = request.headers.get('Authorization').split(" ")[1]
    user_data = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
    user_id = user_data['id']
    user_role = user_data['role']
    
    cur.execute("SELECT created_by, distributor_logo FROM public.distributor WHERE distributor_id = %s", (distributor_id,))
    result = cur.fetchone()
    
    if not result:
        cur.close()
        conn.close()
        return jsonify({'error': 'Distributor not found'}), 404
    
    created_by, existing_logo = result
    
    # Check permissions - only Admin or the creator can edit
    if user_role != 'Admin' and int(created_by) != int(user_id):
        cur.close()
        conn.close()
        return jsonify({'error': 'You do not have permission to edit this distributor'}), 403
    
    # Process logo file if provided
    logo_path = existing_logo
    if 'distributor_logo' in request.files and request.files['distributor_logo'].filename:
        file = request.files['distributor_logo']
        if allowed_file(file.filename):
            # Check file size
            file.seek(0, os.SEEK_END)
            file_size = file.tell()
            file.seek(0)
            
            if file_size > MAX_FILE_SIZE:
                cur.close()
                conn.close()
                return jsonify({'error': 'File size exceeds the 2MB limit'}), 400
            
            # Generate unique filename
            filename = secure_filename(file.filename)
            filename = f"distributor_{uuid.uuid4().hex}.{filename.rsplit('.', 1)[1].lower()}"
            
            # Ensure directory exists
            upload_folder = os.path.join(current_app.static_folder, 'distributor_logos')
            os.makedirs(upload_folder, exist_ok=True)
            
            filepath = os.path.join(upload_folder, filename)
            file.save(filepath)
            logo_path = f'/static/distributor_logos/{filename}'
            
            # Delete old logo if it exists
            if existing_logo and existing_logo.startswith('/static/distributor_logos/'):
                old_logo_path = os.path.join(current_app.static_folder, existing_logo.replace('/static/', ''))
                try:
                    if os.path.exists(old_logo_path):
                        os.remove(old_logo_path)
                except Exception as e:
                    print(f"Error removing old logo: {str(e)}")
    
    try:
        cur.execute("""
            UPDATE public.distributor SET
                distributor_name = %s, city = %s, address = %s,
                primary_contact_person = %s, primary_country_code = %s, primary_mobile_number = %s,
                secondary_contact_person = %s, secondary_country_code = %s, secondary_mobile_number = %s,
                email_id = %s, gst_number = %s, distributor_category = %s,
                whatsapp_country_code = %s, whatsapp_communication_number = %s,
                distributor_logo = %s, updated_at = %s
            WHERE distributor_id = %s
        """, (
            data['distributor_name'], data['city'], data['address'],
            data['primary_contact_person'], data['primary_country_code'], data['primary_mobile_number'],
            data['secondary_contact_person'], data['secondary_country_code'], data['secondary_mobile_number'],
            data['email_id'], data['gst_number'], data['distributor_category'],
            data['whatsapp_country_code'], data['whatsapp_communication_number'],
            logo_path, datetime.now(), distributor_id
        ))
        
        conn.commit()
        
        return jsonify({
            'message': 'Distributor updated successfully'
        })
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cur.close()
        conn.close()

@distributor_bp.route('/api/distributor/<int:distributor_id>', methods=['DELETE'])
@token_required
@role_required(['Admin'])
def delete_distributor(distributor_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    # Get distributor logo path to delete the file
    cur.execute("SELECT distributor_logo FROM public.distributor WHERE distributor_id = %s", (distributor_id,))
    result = cur.fetchone()
    
    if not result:
        cur.close()
        conn.close()
        return jsonify({'error': 'Distributor not found'}), 404
    
    logo_path = result[0]
    
    try:
        # Delete from database
        cur.execute("DELETE FROM public.distributor WHERE distributor_id = %s", (distributor_id,))
        conn.commit()
        
        # Delete logo file if it exists
        if logo_path and logo_path.startswith('/static/distributor_logos/'):
            file_path = os.path.join(current_app.static_folder, logo_path.replace('/static/', ''))
            try:
                if os.path.exists(file_path):
                    os.remove(file_path)
            except Exception as e:
                print(f"Error removing logo file: {str(e)}")
        
        return jsonify({
            'message': 'Distributor deleted successfully'
        })
    
    except Exception as e:
        conn.rollback()
        return jsonify({'error': str(e)}), 500
    
    finally:
        cur.close()
        conn.close()

@distributor_bp.route('/api/distributor/qrcode/<int:distributor_id>', methods=['GET'])
@token_required
def get_distributor_qrcode(distributor_id):
    conn = get_db_connection()
    cur = conn.cursor()
    
    cur.execute("""
        SELECT distributor_name, city, email_id, gst_number
        FROM public.distributor WHERE distributor_id = %s
    """, (distributor_id,))
    
    row = cur.fetchone()
    
    if not row:
        cur.close()
        conn.close()
        return jsonify({'error': 'Distributor not found'}), 404
    
    distributor_data = {
        'id': distributor_id,
        'name': row[0],
        'city': row[1],
        'email': row[2],
        'gst': row[3]
    }
    
    cur.close()
    conn.close()
    
    return jsonify({'distributor_data': distributor_data})
