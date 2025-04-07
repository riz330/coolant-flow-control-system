
from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

from .routes.auth_routes import auth_bp
from .routes.profile_routes import profile_bp
from .routes.client_routes import client_bp
from .routes.distributor_routes import distributor_bp
from .routes.employee_routes import employee_bp  # Import the new employee blueprint

def create_app():
    load_dotenv()
    
    app = Flask(__name__, static_folder='../static')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
    CORS(app, resources={r"*": {"origins": "*"}})  # Enable CORS for all origins and routes
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(distributor_bp)
    app.register_blueprint(employee_bp)  # Register the new employee blueprint
    
    @app.route('/')
    def home():
        return 'Coolant Flow Control System API'
    
    return app
