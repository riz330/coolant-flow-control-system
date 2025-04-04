
from flask import Blueprint, request, jsonify, current_app
import os
import uuid
from werkzeug.utils import secure_filename
from ..utils.auth import token_required, admin_required
from ..utils.db import get_db_connection

distributor_bp = Blueprint('distributor_bp', __name__)

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
UPLOAD_FOLDER = 'static/distributor_logos'

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def ensure_upload_dir():
    """Make sure upload directory exists"""
    os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@distributor_bp.route('/api/distributors', methods=['GET'])
@token_required
def get_distributors(current_user):
    """Get all distributors based on user role"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Different queries based on role
        if current_user['role'] in ['admin', 'manufacturer']:
            # Admin and manufacturer can see all distributors
            query = """
                SELECT distributor_id, distributor_name, city, state, pincode, 
                       address, website, primary_contact_person, primary_country_code, 
                       primary_mobile_number, secondary_contact_person, 
                       secondary_country_code, secondary_mobile_number, 
                       email_id, gst_number, distributor_category, 
                       whatsapp_country_code, whatsapp_communication_number, 
                       distributor_logo, created_at, updated_at
                FROM distributor
                ORDER BY distributor_name
            """
            cur.execute(query)
        elif current_user['role'] == 'manager':
            # Manager can only see their distributors
            query = """
                SELECT distributor_id, distributor_name, city, state, pincode, 
                       address, website, primary_contact_person, primary_country_code, 
                       primary_mobile_number, secondary_contact_person, 
                       secondary_country_code, secondary_mobile_number, 
                       email_id, gst_number, distributor_category, 
                       whatsapp_country_code, whatsapp_communication_number, 
                       distributor_logo, created_at, updated_at
                FROM distributor
                WHERE created_by = %s
                ORDER BY distributor_name
            """
            cur.execute(query, (current_user['user_id'],))
        else:
            # Other roles can see limited distributor info
            query = """
                SELECT distributor_id, distributor_name, city, state, pincode, 
                       address, website, primary_contact_person, primary_country_code, 
                       primary_mobile_number, secondary_contact_person, 
                       secondary_country_code, secondary_mobile_number, 
                       email_id, gst_number, distributor_category, 
                       whatsapp_country_code, whatsapp_communication_number, 
                       distributor_logo, created_at, updated_at
                FROM distributor
                ORDER BY distributor_name
            """
            cur.execute(query)
        
        distributors = []
        for row in cur.fetchall():
            distributor = {
                'distributor_id': row[0],
                'distributor_name': row[1],
                'city': row[2],
                'state': row[3],
                'pincode': row[4],
                'address': row[5],
                'website': row[6],
                'primary_contact_person': row[7],
                'primary_country_code': row[8],
                'primary_mobile_number': row[9],
                'secondary_contact_person': row[10],
                'secondary_country_code': row[11],
                'secondary_mobile_number': row[12],
                'email_id': row[13],
                'gst_number': row[14],
                'distributor_category': row[15],
                'whatsapp_country_code': row[16],
                'whatsapp_communication_number': row[17],
                'distributor_logo': row[18],
                'created_at': row[19].isoformat() if row[19] else None,
                'updated_at': row[20].isoformat() if row[20] else None
            }
            distributors.append(distributor)
        
        cur.close()
        return jsonify(distributors)
    
    except Exception as e:
        current_app.logger.error(f"Error fetching distributors: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@distributor_bp.route('/api/distributors/<int:distributor_id>', methods=['GET'])
@token_required
def get_distributor(current_user, distributor_id):
    """Get a specific distributor"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        query = """
            SELECT distributor_id, distributor_name, city, state, pincode, 
                   address, website, primary_contact_person, primary_country_code, 
                   primary_mobile_number, secondary_contact_person, 
                   secondary_country_code, secondary_mobile_number, 
                   email_id, gst_number, distributor_category, 
                   whatsapp_country_code, whatsapp_communication_number, 
                   distributor_logo, created_by, created_at, updated_at
            FROM distributor
            WHERE distributor_id = %s
        """
        cur.execute(query, (distributor_id,))
        row = cur.fetchone()
        
        if not row:
            return jsonify({'message': 'Distributor not found'}), 404
        
        # Check permissions
        if current_user['role'] not in ['admin', 'manufacturer']:
            if row[19] != current_user['user_id']:  # created_by
                return jsonify({'message': 'Unauthorized access'}), 403
        
        distributor = {
            'distributor_id': row[0],
            'distributor_name': row[1],
            'city': row[2],
            'state': row[3],
            'pincode': row[4],
            'address': row[5],
            'website': row[6],
            'primary_contact_person': row[7],
            'primary_country_code': row[8],
            'primary_mobile_number': row[9],
            'secondary_contact_person': row[10],
            'secondary_country_code': row[11],
            'secondary_mobile_number': row[12],
            'email_id': row[13],
            'gst_number': row[14],
            'distributor_category': row[15],
            'whatsapp_country_code': row[16],
            'whatsapp_communication_number': row[17],
            'distributor_logo': row[18],
            'created_by': row[19],
            'created_at': row[20].isoformat() if row[20] else None,
            'updated_at': row[21].isoformat() if row[21] else None
        }
        
        cur.close()
        return jsonify(distributor)
    
    except Exception as e:
        current_app.logger.error(f"Error fetching distributor: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@distributor_bp.route('/api/distributors', methods=['POST'])
@token_required
def add_distributor(current_user):
    """Add a new distributor"""
    if current_user['role'] not in ['admin', 'manufacturer', 'manager', 'employee']:
        return jsonify({'message': 'Unauthorized access'}), 403
    
    conn = None
    try:
        # Validate required fields
        required_fields = [
            'distributor_name', 'city', 'state', 'pincode', 'address',
            'primary_contact_person', 'primary_country_code', 'primary_mobile_number',
            'email_id', 'gst_number', 'distributor_category',
            'whatsapp_country_code', 'whatsapp_communication_number'
        ]
        
        for field in required_fields:
            if field not in request.form or not request.form[field]:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Handle distributor logo
        logo_path = None
        if 'distributor_logo' in request.files:
            file = request.files['distributor_logo']
            if file and file.filename and allowed_file(file.filename):
                ensure_upload_dir()
                filename = secure_filename(file.filename)
                # Use a unique name to avoid overwriting
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                logo_path = f"/{file_path}"  # Store with leading slash for URL
        else:
            return jsonify({'message': 'Distributor logo is required'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Insert new distributor
        query = """
            INSERT INTO distributor (
                distributor_name, city, state, pincode, address, website,
                primary_contact_person, primary_country_code, primary_mobile_number,
                secondary_contact_person, secondary_country_code, secondary_mobile_number,
                email_id, gst_number, distributor_category,
                whatsapp_country_code, whatsapp_communication_number,
                distributor_logo, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING distributor_id
        """
        
        cur.execute(query, (
            request.form['distributor_name'],
            request.form['city'],
            request.form['state'],
            request.form['pincode'],
            request.form['address'],
            request.form.get('website', None),
            request.form['primary_contact_person'],
            request.form['primary_country_code'],
            request.form['primary_mobile_number'],
            request.form.get('secondary_contact_person', None),
            request.form.get('secondary_country_code', None),
            request.form.get('secondary_mobile_number', None),
            request.form['email_id'],
            request.form['gst_number'],
            request.form['distributor_category'],
            request.form['whatsapp_country_code'],
            request.form['whatsapp_communication_number'],
            logo_path,
            current_user['user_id']
        ))
        
        distributor_id = cur.fetchone()[0]
        conn.commit()
        
        # Return the newly created distributor
        cur.execute("""
            SELECT distributor_id, distributor_name, city, state, pincode, 
                   address, website, primary_contact_person, primary_country_code, 
                   primary_mobile_number, secondary_contact_person, 
                   secondary_country_code, secondary_mobile_number, 
                   email_id, gst_number, distributor_category, 
                   whatsapp_country_code, whatsapp_communication_number, 
                   distributor_logo, created_by, created_at, updated_at
            FROM distributor
            WHERE distributor_id = %s
        """, (distributor_id,))
        
        row = cur.fetchone()
        distributor = {
            'distributor_id': row[0],
            'distributor_name': row[1],
            'city': row[2],
            'state': row[3],
            'pincode': row[4],
            'address': row[5],
            'website': row[6],
            'primary_contact_person': row[7],
            'primary_country_code': row[8],
            'primary_mobile_number': row[9],
            'secondary_contact_person': row[10],
            'secondary_country_code': row[11],
            'secondary_mobile_number': row[12],
            'email_id': row[13],
            'gst_number': row[14],
            'distributor_category': row[15],
            'whatsapp_country_code': row[16],
            'whatsapp_communication_number': row[17],
            'distributor_logo': row[18],
            'created_by': row[19],
            'created_at': row[20].isoformat() if row[20] else None,
            'updated_at': row[21].isoformat() if row[21] else None
        }
        
        cur.close()
        return jsonify(distributor), 201
    
    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.error(f"Error adding distributor: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@distributor_bp.route('/api/distributors/<int:distributor_id>', methods=['PUT'])
@token_required
def update_distributor(current_user, distributor_id):
    """Update an existing distributor"""
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if distributor exists and if user has permission
        cur.execute("""
            SELECT created_by, distributor_logo
            FROM distributor
            WHERE distributor_id = %s
        """, (distributor_id,))
        
        row = cur.fetchone()
        if not row:
            return jsonify({'message': 'Distributor not found'}), 404
        
        created_by, existing_logo = row
        
        # Only admin, manufacturer, or the user who created the distributor can update it
        if current_user['role'] not in ['admin', 'manufacturer'] and created_by != current_user['user_id']:
            return jsonify({'message': 'Unauthorized access'}), 403
        
        # Validate required fields
        required_fields = [
            'distributor_name', 'city', 'state', 'pincode', 'address',
            'primary_contact_person', 'primary_country_code', 'primary_mobile_number',
            'email_id', 'gst_number', 'distributor_category',
            'whatsapp_country_code', 'whatsapp_communication_number'
        ]
        
        for field in required_fields:
            if field not in request.form or not request.form[field]:
                return jsonify({'message': f'Missing required field: {field}'}), 400
        
        # Handle distributor logo
        logo_path = existing_logo
        if 'distributor_logo' in request.files and request.files['distributor_logo'].filename:
            file = request.files['distributor_logo']
            if allowed_file(file.filename):
                ensure_upload_dir()
                filename = secure_filename(file.filename)
                unique_filename = f"{uuid.uuid4().hex}_{filename}"
                file_path = os.path.join(UPLOAD_FOLDER, unique_filename)
                file.save(file_path)
                logo_path = f"/{file_path}"
                
                # Delete old logo if exists
                if existing_logo and os.path.exists(existing_logo[1:]):
                    try:
                        os.remove(existing_logo[1:])
                    except:
                        current_app.logger.warning(f"Could not delete old logo: {existing_logo}")
        
        # Update distributor info
        query = """
            UPDATE distributor SET
                distributor_name = %s,
                city = %s,
                state = %s,
                pincode = %s,
                address = %s,
                website = %s,
                primary_contact_person = %s,
                primary_country_code = %s,
                primary_mobile_number = %s,
                secondary_contact_person = %s,
                secondary_country_code = %s,
                secondary_mobile_number = %s,
                email_id = %s,
                gst_number = %s,
                distributor_category = %s,
                whatsapp_country_code = %s,
                whatsapp_communication_number = %s,
                distributor_logo = %s,
                updated_at = CURRENT_TIMESTAMP
            WHERE distributor_id = %s
            RETURNING distributor_id
        """
        
        cur.execute(query, (
            request.form['distributor_name'],
            request.form['city'],
            request.form['state'],
            request.form['pincode'],
            request.form['address'],
            request.form.get('website', None),
            request.form['primary_contact_person'],
            request.form['primary_country_code'],
            request.form['primary_mobile_number'],
            request.form.get('secondary_contact_person', None),
            request.form.get('secondary_country_code', None),
            request.form.get('secondary_mobile_number', None),
            request.form['email_id'],
            request.form['gst_number'],
            request.form['distributor_category'],
            request.form['whatsapp_country_code'],
            request.form['whatsapp_communication_number'],
            logo_path,
            distributor_id
        ))
        
        conn.commit()
        
        # Return the updated distributor
        cur.execute("""
            SELECT distributor_id, distributor_name, city, state, pincode, 
                   address, website, primary_contact_person, primary_country_code, 
                   primary_mobile_number, secondary_contact_person, 
                   secondary_country_code, secondary_mobile_number, 
                   email_id, gst_number, distributor_category, 
                   whatsapp_country_code, whatsapp_communication_number, 
                   distributor_logo, created_by, created_at, updated_at
            FROM distributor
            WHERE distributor_id = %s
        """, (distributor_id,))
        
        row = cur.fetchone()
        distributor = {
            'distributor_id': row[0],
            'distributor_name': row[1],
            'city': row[2],
            'state': row[3],
            'pincode': row[4],
            'address': row[5],
            'website': row[6],
            'primary_contact_person': row[7],
            'primary_country_code': row[8],
            'primary_mobile_number': row[9],
            'secondary_contact_person': row[10],
            'secondary_country_code': row[11],
            'secondary_mobile_number': row[12],
            'email_id': row[13],
            'gst_number': row[14],
            'distributor_category': row[15],
            'whatsapp_country_code': row[16],
            'whatsapp_communication_number': row[17],
            'distributor_logo': row[18],
            'created_by': row[19],
            'created_at': row[20].isoformat() if row[20] else None,
            'updated_at': row[21].isoformat() if row[21] else None
        }
        
        cur.close()
        return jsonify(distributor)
    
    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.error(f"Error updating distributor: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()

@distributor_bp.route('/api/distributors/<int:distributor_id>', methods=['DELETE'])
@token_required
def delete_distributor(current_user, distributor_id):
    """Delete a distributor"""
    if current_user['role'] != 'admin':
        return jsonify({'message': 'Only admin users can delete distributors'}), 403
    
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # Check if distributor exists and get logo path
        cur.execute("""
            SELECT distributor_logo
            FROM distributor
            WHERE distributor_id = %s
        """, (distributor_id,))
        
        row = cur.fetchone()
        if not row:
            return jsonify({'message': 'Distributor not found'}), 404
        
        logo_path = row[0]
        
        # Delete the distributor
        cur.execute("""
            DELETE FROM distributor
            WHERE distributor_id = %s
        """, (distributor_id,))
        
        conn.commit()
        
        # Delete logo file if exists
        if logo_path and os.path.exists(logo_path[1:]):
            try:
                os.remove(logo_path[1:])
            except:
                current_app.logger.warning(f"Could not delete logo: {logo_path}")
        
        cur.close()
        return jsonify({'message': 'Distributor deleted successfully'})
    
    except Exception as e:
        if conn:
            conn.rollback()
        current_app.logger.error(f"Error deleting distributor: {str(e)}")
        return jsonify({'message': f'Error: {str(e)}'}), 500
    finally:
        if conn:
            conn.close()
