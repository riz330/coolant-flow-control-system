
from flask import Blueprint, request, jsonify
import psycopg2
from psycopg2.extras import RealDictCursor
import os
import jwt
from functools import wraps
from db_config import get_db_connection
from datetime import datetime

employee_bp = Blueprint('employee_bp', __name__)

# Token verification middleware
def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        auth_header = request.headers.get('Authorization')
        
        if auth_header:
            token = auth_header.split(" ")[1]
        
        if not token:
            return jsonify({'message': 'Token is missing!'}), 401
        
        try:
            data = jwt.decode(token, os.getenv('SECRET_KEY'), algorithms=["HS256"])
            current_user = data
        except:
            return jsonify({'message': 'Token is invalid!'}), 401
            
        return f(current_user, *args, **kwargs)
    
    return decorated

# Get all employees with pagination and search
@employee_bp.route('/employees', methods=['GET'])
@token_required
def get_employees(current_user):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Get pagination parameters
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 10))
        offset = (page - 1) * limit
        
        # Get search and filter parameters
        search = request.args.get('search', '')
        category = request.args.get('category', '')
        
        # Base query
        query = "SELECT * FROM employee_details WHERE 1=1"
        count_query = "SELECT COUNT(*) FROM employee_details WHERE 1=1"
        params = []
        
        # Add search condition
        if search:
            query += " AND (employee_name ILIKE %s OR email ILIKE %s OR mobile_number ILIKE %s)"
            count_query += " AND (employee_name ILIKE %s OR email ILIKE %s OR mobile_number ILIKE %s)"
            search_param = f'%{search}%'
            params.extend([search_param, search_param, search_param])
        
        # Add category filter
        if category:
            query += " AND category = %s"
            count_query += " AND category = %s"
            params.append(category)
        
        # Add role-based filtering
        if current_user['role'] == 'manager':
            query += " AND manager_name = %s"
            count_query += " AND manager_name = %s"
            params.append(current_user['full_name'])
        elif current_user['role'] == 'employee':
            query += " AND email = %s"
            count_query += " AND email = %s"
            params.append(current_user['email'])
        
        # Get total count
        cur.execute(count_query, params)
        total_count = cur.fetchone()['count']
        
        # Add pagination
        query += " ORDER BY id LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        
        # Execute query
        cur.execute(query, params)
        employees = cur.fetchall()
        
        # Calculate total pages
        total_pages = (total_count + limit - 1) // limit
        
        # Close connection
        cur.close()
        conn.close()
        
        return jsonify({
            'employees': employees,
            'pagination': {
                'total': total_count,
                'pages': total_pages,
                'page': page,
                'limit': limit
            }
        }), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Get employee categories for filter dropdown
@employee_bp.route('/employees/categories', methods=['GET'])
@token_required
def get_employee_categories(current_user):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT DISTINCT category FROM employee_details WHERE category IS NOT NULL")
        categories = [row['category'] for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return jsonify({'categories': categories}), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Get managers for dropdown
@employee_bp.route('/employees/managers', methods=['GET'])
@token_required
def get_managers(current_user):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT full_name FROM user_details WHERE role = 'manager'")
        managers = [row['full_name'] for row in cur.fetchall()]
        
        cur.close()
        conn.close()
        
        return jsonify({'managers': managers}), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Create a new employee
@employee_bp.route('/employees', methods=['POST'])
@token_required
def create_employee(current_user):
    try:
        # Check if user has permission
        if current_user['role'] not in ['admin', 'distributor', 'manager']:
            return jsonify({'message': 'Permission denied!'}), 403
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['employee_name', 'address', 'mobile_number', 'email', 'employee_type']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'message': f'{field} is required!'}), 400
        
        # Validate mobile number
        if len(data['mobile_number']) != 10:
            return jsonify({'message': 'Mobile number must be 10 digits!'}), 400
        
        # Validate whatsapp number
        if len(data['whatsapp_number']) != 10:
            return jsonify({'message': 'WhatsApp number must be 10 digits!'}), 400
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # For manager role, only allow assignment of employees to themselves
        if current_user['role'] == 'manager' and data.get('manager_name') != current_user['full_name']:
            data['manager_name'] = current_user['full_name']
        
        # Insert new employee
        cur.execute("""
            INSERT INTO employee_details (
                employee_name, address, mobile_number, mobile_country_code,
                whatsapp_number, whatsapp_country_code, email, employee_type,
                manager_name, category
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s) RETURNING id
        """, (
            data['employee_name'],
            data['address'],
            data['mobile_number'],
            data.get('mobile_country_code', '+91'),
            data['whatsapp_number'],
            data.get('whatsapp_country_code', '+91'),
            data['email'],
            data['employee_type'],
            data.get('manager_name'),
            data.get('category')
        ))
        
        new_id = cur.fetchone()['id']
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'message': 'Employee created successfully!', 'id': new_id}), 201
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Get a specific employee
@employee_bp.route('/employees/<int:id>', methods=['GET'])
@token_required
def get_employee(current_user, id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        cur.execute("SELECT * FROM employee_details WHERE id = %s", (id,))
        employee = cur.fetchone()
        
        cur.close()
        conn.close()
        
        if not employee:
            return jsonify({'message': 'Employee not found!'}), 404
        
        # Check if user has permission to view this employee
        if current_user['role'] == 'manager' and employee['manager_name'] != current_user['full_name']:
            return jsonify({'message': 'Permission denied!'}), 403
        
        if current_user['role'] == 'employee' and employee['email'] != current_user['email']:
            return jsonify({'message': 'Permission denied!'}), 403
        
        return jsonify({'employee': employee}), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Update employee
@employee_bp.route('/employees/<int:id>', methods=['PUT'])
@token_required
def update_employee(current_user, id):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if employee exists
        cur.execute("SELECT * FROM employee_details WHERE id = %s", (id,))
        employee = cur.fetchone()
        
        if not employee:
            cur.close()
            conn.close()
            return jsonify({'message': 'Employee not found!'}), 404
        
        # Check permission
        if current_user['role'] == 'manager' and employee['manager_name'] != current_user['full_name']:
            cur.close()
            conn.close()
            return jsonify({'message': 'Permission denied!'}), 403
        
        if current_user['role'] == 'employee' and employee['email'] != current_user['email']:
            cur.close()
            conn.close()
            return jsonify({'message': 'Permission denied!'}), 403
        
        # For employee role, only allow updating specific fields
        data = request.get_json()
        
        if current_user['role'] == 'employee':
            # Employees can only update their address and phone numbers
            allowed_fields = ['address', 'mobile_number', 'mobile_country_code', 
                              'whatsapp_number', 'whatsapp_country_code']
            
            update_data = {k: v for k, v in data.items() if k in allowed_fields}
            
            # Validate mobile numbers
            if 'mobile_number' in update_data and len(update_data['mobile_number']) != 10:
                cur.close()
                conn.close()
                return jsonify({'message': 'Mobile number must be 10 digits!'}), 400
            
            if 'whatsapp_number' in update_data and len(update_data['whatsapp_number']) != 10:
                cur.close()
                conn.close()
                return jsonify({'message': 'WhatsApp number must be 10 digits!'}), 400
            
            # Create SQL for update
            if update_data:
                fields = ', '.join([f"{k} = %s" for k in update_data.keys()])
                values = list(update_data.values())
                values.append(id)
                
                cur.execute(f"UPDATE employee_details SET {fields} WHERE id = %s", values)
                conn.commit()
        else:
            # Managers and admins can update all fields
            # Validate required fields
            required_fields = ['employee_name', 'address', 'mobile_number', 'email', 'employee_type']
            for field in required_fields:
                if field not in data or not data[field]:
                    cur.close()
                    conn.close()
                    return jsonify({'message': f'{field} is required!'}), 400
            
            # Validate mobile numbers
            if len(data['mobile_number']) != 10:
                cur.close()
                conn.close()
                return jsonify({'message': 'Mobile number must be 10 digits!'}), 400
            
            if len(data['whatsapp_number']) != 10:
                cur.close()
                conn.close()
                return jsonify({'message': 'WhatsApp number must be 10 digits!'}), 400
            
            # For manager role, only allow assignment of employees to themselves
            if current_user['role'] == 'manager' and data.get('manager_name') != current_user['full_name']:
                data['manager_name'] = current_user['full_name']
            
            # Update employee
            cur.execute("""
                UPDATE employee_details SET
                    employee_name = %s,
                    address = %s,
                    mobile_number = %s,
                    mobile_country_code = %s,
                    whatsapp_number = %s,
                    whatsapp_country_code = %s,
                    email = %s,
                    employee_type = %s,
                    manager_name = %s,
                    category = %s
                WHERE id = %s
            """, (
                data['employee_name'],
                data['address'],
                data['mobile_number'],
                data.get('mobile_country_code', '+91'),
                data['whatsapp_number'],
                data.get('whatsapp_country_code', '+91'),
                data['email'],
                data['employee_type'],
                data.get('manager_name'),
                data.get('category'),
                id
            ))
            conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'message': 'Employee updated successfully!'}), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500

# Delete employee
@employee_bp.route('/employees/<int:id>', methods=['DELETE'])
@token_required
def delete_employee(current_user, id):
    try:
        # Employees cannot delete records
        if current_user['role'] == 'employee':
            return jsonify({'message': 'Permission denied!'}), 403
        
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # Check if employee exists
        cur.execute("SELECT * FROM employee_details WHERE id = %s", (id,))
        employee = cur.fetchone()
        
        if not employee:
            cur.close()
            conn.close()
            return jsonify({'message': 'Employee not found!'}), 404
        
        # Check permission for manager
        if current_user['role'] == 'manager' and employee['manager_name'] != current_user['full_name']:
            cur.close()
            conn.close()
            return jsonify({'message': 'Permission denied!'}), 403
        
        # Delete employee
        cur.execute("DELETE FROM employee_details WHERE id = %s", (id,))
        conn.commit()
        
        cur.close()
        conn.close()
        
        return jsonify({'message': 'Employee deleted successfully!'}), 200
    
    except Exception as e:
        return jsonify({'message': str(e)}), 500
