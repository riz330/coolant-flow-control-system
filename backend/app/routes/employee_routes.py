
from flask import Blueprint, request, jsonify
from psycopg2 import sql
import psycopg2.extras
from db_config import get_db_connection
from app.utils.auth_utils import token_required, role_required
import os
import jwt
from flask import current_app
import uuid
from datetime import datetime

employee_bp = Blueprint('employee', __name__, url_prefix='/api/employees')

# Get all employees with pagination, search and filtering
@employee_bp.route('', methods=['GET'])
@token_required
def get_employees():
    try:
        # Get query parameters
        page = request.args.get('page', default=1, type=int)
        limit = request.args.get('limit', default=10, type=int)
        search = request.args.get('search', default='', type=str)
        category = request.args.get('category', default='', type=str)
        offset = (page - 1) * limit

        # Get user role and ID from token
        token = request.headers['Authorization'].split(" ")[1]
        decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        user_role = decoded_token.get('role')
        user_id = decoded_token.get('user_id')
        user_name = decoded_token.get('name')

        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)

        # Build the query based on role
        query_conditions = []
        query_params = {}

        # Apply search filter if provided
        if search:
            search_condition = """
                (employee_name ILIKE %(search)s OR 
                email ILIKE %(search)s OR 
                address ILIKE %(search)s)
            """
            query_conditions.append(search_condition)
            query_params['search'] = f'%{search}%'

        # Apply category filter if provided
        if category:
            query_conditions.append("category = %(category)s")
            query_params['category'] = category

        # Apply role-based filters
        if user_role == 'manager':
            query_conditions.append("manager_name = %(manager_name)s")
            query_params['manager_name'] = user_name
        elif user_role == 'employee':
            # Employees can only see their own details - match by email from token
            query_conditions.append("email = %(email)s")
            query_params['email'] = decoded_token.get('email')

        # Construct the WHERE clause
        where_clause = " AND ".join(query_conditions) if query_conditions else "1=1"

        # Count total records for pagination
        count_query = f"SELECT COUNT(*) FROM employee_details WHERE {where_clause}"
        cursor.execute(count_query, query_params)
        total_count = cursor.fetchone()[0]

        # Fetch the actual data with pagination
        query = f"""
            SELECT 
                id, employee_name, address, 
                mobile_country_code, mobile_number, 
                whatsapp_country_code, whatsapp_number, 
                email, employee_type, manager_name, category, 
                to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
            FROM employee_details 
            WHERE {where_clause}
            ORDER BY created_at DESC
            LIMIT %(limit)s OFFSET %(offset)s
        """
        
        query_params['limit'] = limit
        query_params['offset'] = offset
        
        cursor.execute(query, query_params)
        employees = cursor.fetchall()
        
        # Fetch available categories for filter dropdown
        cursor.execute("SELECT DISTINCT category FROM employee_details ORDER BY category")
        categories = [cat[0] for cat in cursor.fetchall() if cat[0]]
        
        # Convert to list of dictionaries
        employees_list = []
        for emp in employees:
            emp_dict = dict(emp)
            employees_list.append(emp_dict)
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'employees': employees_list,
            'totalCount': total_count,
            'totalPages': (total_count + limit - 1) // limit,
            'currentPage': page,
            'categories': categories
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get available managers for dropdown
@employee_bp.route('/managers', methods=['GET'])
@token_required
def get_managers():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Fetch managers from user_details table
        cursor.execute("""
            SELECT user_id, full_name 
            FROM user_details 
            WHERE role = 'manager'
            ORDER BY full_name
        """)
        
        managers = [dict(row) for row in cursor.fetchall()]
        cursor.close()
        conn.close()
        
        return jsonify({'managers': managers})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Add a new employee
@employee_bp.route('', methods=['POST'])
@token_required
@role_required(['admin', 'manager', 'distributor'])
def add_employee():
    try:
        data = request.get_json()
        
        # Get user details from token
        token = request.headers['Authorization'].split(" ")[1]
        decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        user_role = decoded_token.get('role')
        user_name = decoded_token.get('name')
        
        # If manager, force set manager_name to their own name
        if user_role == 'manager':
            data['manager_name'] = user_name
            
        # Validate required fields
        required_fields = ['employee_name', 'address', 'mobile_number', 'whatsapp_number', 
                          'email', 'employee_type']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Phone number validation
        if len(data['mobile_number']) != 10 or not data['mobile_number'].isdigit():
            return jsonify({'error': 'Mobile number must be 10 digits'}), 400
            
        if len(data['whatsapp_number']) != 10 or not data['whatsapp_number'].isdigit():
            return jsonify({'error': 'WhatsApp number must be 10 digits'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if email already exists
        cursor.execute("SELECT COUNT(*) FROM employee_details WHERE email = %s", (data['email'],))
        if cursor.fetchone()[0] > 0:
            return jsonify({'error': 'Email already exists'}), 400
            
        # Insert new employee
        cursor.execute("""
            INSERT INTO employee_details 
            (employee_name, address, mobile_country_code, mobile_number, 
             whatsapp_country_code, whatsapp_number, email, employee_type, 
             manager_name, category)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            RETURNING id
        """, (
            data['employee_name'],
            data['address'],
            data.get('mobile_country_code', '+91'),
            data['mobile_number'],
            data.get('whatsapp_country_code', '+91'),
            data['whatsapp_number'],
            data['email'],
            data['employee_type'],
            data.get('manager_name', None),
            data.get('category', 'General')
        ))
        
        new_id = cursor.fetchone()[0]
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Employee added successfully', 'id': new_id}), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Get a specific employee
@employee_bp.route('/<int:employee_id>', methods=['GET'])
@token_required
def get_employee(employee_id):
    try:
        # Get user role from token
        token = request.headers['Authorization'].split(" ")[1]
        decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        user_role = decoded_token.get('role')
        user_name = decoded_token.get('name')
        user_email = decoded_token.get('email')
        
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # Add role-based conditions
        conditions = ["id = %s"]
        params = [employee_id]
        
        if user_role == 'manager':
            conditions.append("manager_name = %s")
            params.append(user_name)
        elif user_role == 'employee':
            conditions.append("email = %s")
            params.append(user_email)
            
        where_clause = " AND ".join(conditions)
        
        query = f"""
            SELECT 
                id, employee_name, address, 
                mobile_country_code, mobile_number, 
                whatsapp_country_code, whatsapp_number, 
                email, employee_type, manager_name, category,
                to_char(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at
            FROM employee_details 
            WHERE {where_clause}
        """
        
        cursor.execute(query, params)
        employee = cursor.fetchone()
        
        cursor.close()
        conn.close()
        
        if not employee:
            return jsonify({'error': 'Employee not found or you do not have permission to view this record'}), 404
            
        return jsonify(dict(employee))
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Update an employee
@employee_bp.route('/<int:employee_id>', methods=['PUT'])
@token_required
def update_employee(employee_id):
    try:
        data = request.get_json()
        
        # Get user details from token
        token = request.headers['Authorization'].split(" ")[1]
        decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        user_role = decoded_token.get('role')
        user_name = decoded_token.get('name')
        user_email = decoded_token.get('email')
        
        # Validate required fields
        required_fields = ['employee_name', 'address', 'mobile_number', 'whatsapp_number', 
                          'email', 'employee_type']
        for field in required_fields:
            if field not in data or not data[field]:
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Phone number validation
        if len(data['mobile_number']) != 10 or not data['mobile_number'].isdigit():
            return jsonify({'error': 'Mobile number must be 10 digits'}), 400
            
        if len(data['whatsapp_number']) != 10 or not data['whatsapp_number'].isdigit():
            return jsonify({'error': 'WhatsApp number must be 10 digits'}), 400
            
        conn = get_db_connection()
        cursor = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        
        # First check if user has permission to edit this employee
        permission_query = "SELECT id, email, manager_name FROM employee_details WHERE id = %s"
        cursor.execute(permission_query, (employee_id,))
        employee = cursor.fetchone()
        
        if not employee:
            return jsonify({'error': 'Employee not found'}), 404
            
        # Check permissions based on role
        has_permission = False
        if user_role in ['admin', 'distributor']:
            has_permission = True
        elif user_role == 'manager' and employee['manager_name'] == user_name:
            has_permission = True
        elif user_role == 'employee' and employee['email'] == user_email:
            # Employee can only edit their own details and cannot change certain fields
            has_permission = True
            # Prevent changing critical fields
            data['employee_type'] = employee['employee_type']
            data['manager_name'] = employee['manager_name']
            
        if not has_permission:
            return jsonify({'error': 'You do not have permission to edit this employee'}), 403
            
        # Check if email already exists (for another employee)
        cursor.execute("SELECT COUNT(*) FROM employee_details WHERE email = %s AND id != %s", 
                      (data['email'], employee_id))
        if cursor.fetchone()[0] > 0:
            return jsonify({'error': 'Email already exists for another employee'}), 400
            
        # If manager, force set manager_name to their name for new employees they create
        if user_role == 'manager' and data.get('manager_name') != user_name:
            data['manager_name'] = user_name
            
        # Update employee
        update_query = """
            UPDATE employee_details SET
                employee_name = %s,
                address = %s,
                mobile_country_code = %s,
                mobile_number = %s,
                whatsapp_country_code = %s,
                whatsapp_number = %s,
                email = %s,
                employee_type = %s,
                manager_name = %s,
                category = %s
            WHERE id = %s
        """
        
        cursor.execute(update_query, (
            data['employee_name'],
            data['address'],
            data.get('mobile_country_code', '+91'),
            data['mobile_number'],
            data.get('whatsapp_country_code', '+91'),
            data['whatsapp_number'],
            data['email'],
            data['employee_type'],
            data.get('manager_name', None),
            data.get('category', 'General'),
            employee_id
        ))
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Employee updated successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Delete an employee
@employee_bp.route('/<int:employee_id>', methods=['DELETE'])
@token_required
@role_required(['admin', 'manager', 'distributor'])
def delete_employee(employee_id):
    try:
        # Get user details from token
        token = request.headers['Authorization'].split(" ")[1]
        decoded_token = jwt.decode(token, current_app.config['SECRET_KEY'], algorithms=["HS256"])
        user_role = decoded_token.get('role')
        user_name = decoded_token.get('name')
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Check if user has permission to delete this employee
        if user_role == 'manager':
            cursor.execute("SELECT COUNT(*) FROM employee_details WHERE id = %s AND manager_name = %s", 
                          (employee_id, user_name))
            if cursor.fetchone()[0] == 0:
                return jsonify({'error': 'You do not have permission to delete this employee'}), 403
                
        # Delete the employee
        cursor.execute("DELETE FROM employee_details WHERE id = %s RETURNING id", (employee_id,))
        deleted = cursor.fetchone()
        
        if not deleted:
            return jsonify({'error': 'Employee not found'}), 404
            
        conn.commit()
        cursor.close()
        conn.close()
        
        return jsonify({'message': 'Employee deleted successfully'})
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
