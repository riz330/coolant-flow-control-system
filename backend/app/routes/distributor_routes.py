
from flask import Blueprint, request, jsonify, current_app
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from werkzeug.utils import secure_filename
import uuid
import sys
sys.path.append('../..')  # Add the parent directory to the path
from db_config import get_db_connection

distributor_bp = Blueprint('distributor', __name__, url_prefix='/api/distributors')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@distributor_bp.route('/', methods=['GET'])
def get_distributors():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query to get all distributors
        cursor.execute("""
            SELECT distributor_id, distributor_name, city, state, pincode, address, 
                website, primary_contact_person, primary_country_code, primary_mobile_number, 
                secondary_contact_person, secondary_country_code, secondary_mobile_number, 
                email_id, gst_number, distributor_category, whatsapp_country_code, 
                whatsapp_communication_number, distributor_logo, created_by, created_at, updated_at
            FROM distributor
            ORDER BY distributor_name
        """)
        
        distributors = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "distributors": distributors
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@distributor_bp.route('/<int:distributor_id>', methods=['GET'])
def get_distributor(distributor_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query to get specific distributor
        cursor.execute("""
            SELECT distributor_id, distributor_name, city, state, pincode, address, 
                website, primary_contact_person, primary_country_code, primary_mobile_number, 
                secondary_contact_person, secondary_country_code, secondary_mobile_number, 
                email_id, gst_number, distributor_category, whatsapp_country_code, 
                whatsapp_communication_number, distributor_logo, created_by, created_at, updated_at
            FROM distributor
            WHERE distributor_id = %s
        """, (distributor_id,))
        
        distributor = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not distributor:
            return jsonify({"error": "Distributor not found"}), 404
        
        return jsonify({
            "success": True,
            "distributor": distributor
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@distributor_bp.route('/', methods=['POST'])
def create_distributor():
    try:
        # Handle form data and file upload
        distributor_name = request.form.get('distributor_name')
        city = request.form.get('city')
        state = request.form.get('state')
        pincode = request.form.get('pincode')
        address = request.form.get('address')
        website = request.form.get('website')
        primary_contact_person = request.form.get('primary_contact_person')
        primary_country_code = request.form.get('primary_country_code')
        primary_mobile_number = request.form.get('primary_mobile_number')
        secondary_contact_person = request.form.get('secondary_contact_person')
        secondary_country_code = request.form.get('secondary_country_code')
        secondary_mobile_number = request.form.get('secondary_mobile_number')
        email_id = request.form.get('email_id')
        gst_number = request.form.get('gst_number')
        distributor_category = request.form.get('distributor_category')
        whatsapp_country_code = request.form.get('whatsapp_country_code')
        whatsapp_communication_number = request.form.get('whatsapp_communication_number')
        created_by = request.form.get('created_by')
        
        # Validate required fields
        if not all([distributor_name, city, state, pincode, address, primary_contact_person, 
                   primary_country_code, primary_mobile_number, email_id, gst_number, 
                   distributor_category, whatsapp_country_code, whatsapp_communication_number]):
            return jsonify({"error": "Missing required fields"}), 400
        
        # Process logo if provided
        distributor_logo_path = None
        if 'distributor_logo' in request.files:
            file = request.files['distributor_logo']
            if file and file.filename and allowed_file(file.filename):
                # Generate a unique filename
                filename = secure_filename(file.filename)
                file_extension = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # Create directory if it doesn't exist
                upload_dir = os.path.join('static', 'distributor_logos')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Save file
                file_path = os.path.join(upload_dir, unique_filename)
                file.save(file_path)
                
                # Set file path
                distributor_logo_path = f"/static/distributor_logos/{unique_filename}"
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Insert distributor
        cursor.execute("""
            INSERT INTO distributor (
                distributor_name, city, state, pincode, address, website, 
                primary_contact_person, primary_country_code, primary_mobile_number, 
                secondary_contact_person, secondary_country_code, secondary_mobile_number, 
                email_id, gst_number, distributor_category, whatsapp_country_code, 
                whatsapp_communication_number, distributor_logo, created_by
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING distributor_id
        """, (
            distributor_name, city, state, pincode, address, website,
            primary_contact_person, primary_country_code, primary_mobile_number,
            secondary_contact_person, secondary_country_code, secondary_mobile_number,
            email_id, gst_number, distributor_category, whatsapp_country_code,
            whatsapp_communication_number, distributor_logo_path, created_by
        ))
        
        distributor_id = cursor.fetchone()['distributor_id']
        conn.commit()
        
        # Fetch the created distributor
        cursor.execute("""
            SELECT distributor_id, distributor_name, city, state, pincode, address, 
                website, primary_contact_person, primary_country_code, primary_mobile_number, 
                secondary_contact_person, secondary_country_code, secondary_mobile_number, 
                email_id, gst_number, distributor_category, whatsapp_country_code, 
                whatsapp_communication_number, distributor_logo, created_by, created_at, updated_at
            FROM distributor
            WHERE distributor_id = %s
        """, (distributor_id,))
        
        new_distributor = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Distributor created successfully",
            "distributor": new_distributor
        }), 201
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@distributor_bp.route('/<int:distributor_id>', methods=['PUT'])
def update_distributor(distributor_id):
    try:
        # Handle form data and file upload
        distributor_name = request.form.get('distributor_name')
        city = request.form.get('city')
        state = request.form.get('state')
        pincode = request.form.get('pincode')
        address = request.form.get('address')
        website = request.form.get('website')
        primary_contact_person = request.form.get('primary_contact_person')
        primary_country_code = request.form.get('primary_country_code')
        primary_mobile_number = request.form.get('primary_mobile_number')
        secondary_contact_person = request.form.get('secondary_contact_person')
        secondary_country_code = request.form.get('secondary_country_code')
        secondary_mobile_number = request.form.get('secondary_mobile_number')
        email_id = request.form.get('email_id')
        gst_number = request.form.get('gst_number')
        distributor_category = request.form.get('distributor_category')
        whatsapp_country_code = request.form.get('whatsapp_country_code')
        whatsapp_communication_number = request.form.get('whatsapp_communication_number')
        
        # Validate required fields
        if not all([distributor_name, city, state, pincode, address, primary_contact_person, 
                   primary_country_code, primary_mobile_number, email_id, gst_number, 
                   distributor_category, whatsapp_country_code, whatsapp_communication_number]):
            return jsonify({"error": "Missing required fields"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if distributor exists
        cursor.execute("SELECT distributor_logo FROM distributor WHERE distributor_id = %s", (distributor_id,))
        distributor = cursor.fetchone()
        
        if not distributor:
            cursor.close()
            conn.close()
            return jsonify({"error": "Distributor not found"}), 404
        
        # Process logo if provided
        distributor_logo_path = distributor['distributor_logo']
        if 'distributor_logo' in request.files:
            file = request.files['distributor_logo']
            if file and file.filename and allowed_file(file.filename):
                # Generate a unique filename
                filename = secure_filename(file.filename)
                file_extension = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # Create directory if it doesn't exist
                upload_dir = os.path.join('static', 'distributor_logos')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Save file
                file_path = os.path.join(upload_dir, unique_filename)
                file.save(file_path)
                
                # Remove old file if exists
                if distributor_logo_path and os.path.exists(distributor_logo_path[1:]):  # Remove leading /
                    try:
                        os.remove(distributor_logo_path[1:])
                    except Exception:
                        pass  # Ignore if file doesn't exist
                
                # Update file path
                distributor_logo_path = f"/static/distributor_logos/{unique_filename}"
        
        # Update distributor
        cursor.execute("""
            UPDATE distributor
            SET distributor_name = %s, city = %s, state = %s, pincode = %s, address = %s, 
                website = %s, primary_contact_person = %s, primary_country_code = %s, 
                primary_mobile_number = %s, secondary_contact_person = %s, 
                secondary_country_code = %s, secondary_mobile_number = %s, 
                email_id = %s, gst_number = %s, distributor_category = %s, 
                whatsapp_country_code = %s, whatsapp_communication_number = %s, 
                distributor_logo = %s, updated_at = CURRENT_TIMESTAMP
            WHERE distributor_id = %s
            RETURNING distributor_id, distributor_name, city, state, pincode, address, 
                website, primary_contact_person, primary_country_code, primary_mobile_number, 
                secondary_contact_person, secondary_country_code, secondary_mobile_number, 
                email_id, gst_number, distributor_category, whatsapp_country_code, 
                whatsapp_communication_number, distributor_logo, created_by, created_at, updated_at
        """, (
            distributor_name, city, state, pincode, address, website,
            primary_contact_person, primary_country_code, primary_mobile_number,
            secondary_contact_person, secondary_country_code, secondary_mobile_number,
            email_id, gst_number, distributor_category, whatsapp_country_code,
            whatsapp_communication_number, distributor_logo_path, distributor_id
        ))
        
        conn.commit()
        updated_distributor = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Distributor updated successfully",
            "distributor": updated_distributor
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@distributor_bp.route('/<int:distributor_id>', methods=['DELETE'])
def delete_distributor(distributor_id):
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if distributor exists and get logo path
        cursor.execute("SELECT distributor_logo FROM distributor WHERE distributor_id = %s", (distributor_id,))
        distributor = cursor.fetchone()
        
        if not distributor:
            cursor.close()
            conn.close()
            return jsonify({"error": "Distributor not found"}), 404
        
        # Delete logo file if exists
        logo_path = distributor['distributor_logo']
        if logo_path and os.path.exists(logo_path[1:]):  # Remove leading /
            try:
                os.remove(logo_path[1:])
            except Exception:
                pass  # Ignore if file doesn't exist
        
        # Delete distributor
        cursor.execute("DELETE FROM distributor WHERE distributor_id = %s", (distributor_id,))
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Distributor deleted successfully"
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@distributor_bp.route('/categories', methods=['GET'])
def get_categories():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query to get distinct categories
        cursor.execute("SELECT DISTINCT distributor_category FROM distributor ORDER BY distributor_category")
        categories = [row['distributor_category'] for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "categories": categories
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@distributor_bp.route('/cities', methods=['GET'])
def get_cities():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query to get distinct cities
        cursor.execute("SELECT DISTINCT city FROM distributor ORDER BY city")
        cities = [row['city'] for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "cities": cities
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@distributor_bp.route('/states', methods=['GET'])
def get_states():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query to get distinct states
        cursor.execute("SELECT DISTINCT state FROM distributor ORDER BY state")
        states = [row['state'] for row in cursor.fetchall()]
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "states": states
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500
