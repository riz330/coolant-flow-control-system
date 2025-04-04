
from flask import Blueprint, request, jsonify, current_app
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import sys
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash, generate_password_hash
import uuid
sys.path.append('../..')  # Add the parent directory to the path
from db_config import get_db_connection

profile_bp = Blueprint('profile', __name__, url_prefix='/api/profile')

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@profile_bp.route('/', methods=['GET'])
def get_profile():
    try:
        user_id = request.args.get('user_id')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query to get user by ID
        cursor.execute(
            """
            SELECT user_id, username, fullname, email, designation, company, 
                   mobile_number, profile_image, role 
            FROM user_details 
            WHERE user_id = %s
            """,
            (user_id,)
        )
        user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        return jsonify({
            "success": True,
            "user": user
        }), 200
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@profile_bp.route('/update', methods=['PUT'])
def update_profile():
    try:
        # Handle form data and file upload
        user_id = request.form.get('user_id')
        fullname = request.form.get('fullname')
        username = request.form.get('username')
        email = request.form.get('email')
        designation = request.form.get('designation')
        company = request.form.get('company')
        mobile_number = request.form.get('mobile_number')
        
        if not user_id:
            return jsonify({"error": "User ID is required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user exists
        cursor.execute("SELECT profile_image FROM user_details WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            cursor.close()
            conn.close()
            return jsonify({"error": "User not found"}), 404
        
        # Process profile image if provided
        profile_image_path = user['profile_image']
        if 'profile_image' in request.files:
            file = request.files['profile_image']
            if file and file.filename and allowed_file(file.filename):
                # Generate a unique filename
                filename = secure_filename(file.filename)
                file_extension = filename.rsplit('.', 1)[1].lower()
                unique_filename = f"{uuid.uuid4().hex}.{file_extension}"
                
                # Create directory if it doesn't exist
                upload_dir = os.path.join('static', 'user_profiles')
                os.makedirs(upload_dir, exist_ok=True)
                
                # Save file
                file_path = os.path.join(upload_dir, unique_filename)
                file.save(file_path)
                
                # Update file path
                profile_image_path = f"/static/user_profiles/{unique_filename}"
        
        # Update user details
        cursor.execute(
            """
            UPDATE user_details 
            SET fullname = %s, username = %s, email = %s, designation = %s, 
                company = %s, mobile_number = %s, profile_image = %s
            WHERE user_id = %s
            RETURNING user_id, username, fullname, email, designation, 
                     company, mobile_number, profile_image, role
            """,
            (fullname, username, email, designation, 
             company, mobile_number, profile_image_path, user_id)
        )
        conn.commit()
        updated_user = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Profile updated successfully",
            "user": updated_user
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
