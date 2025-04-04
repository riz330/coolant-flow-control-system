
from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import hashlib
import secrets
import os
from datetime import datetime, timedelta
import jwt
from werkzeug.security import check_password_hash, generate_password_hash
import sys
sys.path.append('../..')  # Add the parent directory to the path
from db_config import get_db_connection

auth_bp = Blueprint('auth', __name__, url_prefix='/api')

@auth_bp.route('/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Query to get user by email
        cursor.execute(
            "SELECT user_id, username, email, password_hash, role FROM user_details WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()
        
        if user and check_password_hash(user['password_hash'], password):
            # Generate a token
            secret_key = os.environ.get('JWT_SECRET_KEY', 'default_secret_key')
            token = jwt.encode({
                'user_id': user['user_id'],
                'email': user['email'],
                'role': user['role'],
                'exp': datetime.utcnow() + timedelta(hours=24)
            }, secret_key, algorithm='HS256')
            
            # Return token and user data (excluding password)
            user_data = {k: v for k, v in user.items() if k != 'password_hash'}
            
            cursor.close()
            conn.close()
            
            return jsonify({
                "success": True,
                "token": token,
                "user": user_data
            }), 200
        else:
            cursor.close()
            conn.close()
            return jsonify({"error": "Invalid email or password"}), 401
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/forgot-password', methods=['POST'])
def forgot_password():
    try:
        data = request.get_json()
        email = data.get('email')
        
        if not email:
            return jsonify({"error": "Email is required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if user exists
        cursor.execute("SELECT user_id FROM user_details WHERE email = %s", (email,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        expiry = datetime.utcnow() + timedelta(hours=1)
        
        # Store token in database
        cursor.execute(
            "UPDATE user_details SET reset_token = %s, reset_token_expiry = %s WHERE email = %s",
            (reset_token, expiry, email)
        )
        conn.commit()
        
        # In a real application, send an email with the reset link
        # For now, we'll just return the token in the response
        reset_link = f"/reset-password?token={reset_token}"
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Password reset link has been sent to your email",
            "reset_link": reset_link  # This would be removed in production
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/reset-password', methods=['POST'])
def reset_password():
    try:
        data = request.get_json()
        token = data.get('token')
        new_password = data.get('new_password')
        
        if not token or not new_password:
            return jsonify({"error": "Token and new password are required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verify token
        cursor.execute(
            "SELECT user_id FROM user_details WHERE reset_token = %s AND reset_token_expiry > %s",
            (token, datetime.utcnow())
        )
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "Invalid or expired token"}), 400
        
        # Update password
        hashed_password = generate_password_hash(new_password)
        cursor.execute(
            "UPDATE user_details SET password_hash = %s, reset_token = NULL, reset_token_expiry = NULL WHERE user_id = %s",
            (hashed_password, user['user_id'])
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Password has been reset successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@auth_bp.route('/change-password', methods=['POST'])
def change_password():
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        current_password = data.get('current_password')
        new_password = data.get('new_password')
        
        if not user_id or not current_password or not new_password:
            return jsonify({"error": "User ID, current password, and new password are required"}), 400
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        
        # Verify current password
        cursor.execute("SELECT password_hash FROM user_details WHERE user_id = %s", (user_id,))
        user = cursor.fetchone()
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        if not check_password_hash(user['password_hash'], current_password):
            return jsonify({"error": "Current password is incorrect"}), 400
        
        # Update password
        hashed_password = generate_password_hash(new_password)
        cursor.execute(
            "UPDATE user_details SET password_hash = %s WHERE user_id = %s",
            (hashed_password, user_id)
        )
        conn.commit()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            "success": True,
            "message": "Password has been changed successfully"
        }), 200
        
    except Exception as e:
        return jsonify({"error": str(e)}), 500
