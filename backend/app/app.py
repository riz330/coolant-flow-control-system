
from flask import Flask
from flask_cors import CORS
import os
import logging
from .routes.auth_routes import auth_bp
from .routes.profile_routes import profile_bp
from .routes.distributor_routes import distributor_bp

def create_app():
    app = Flask(__name__)
    CORS(app)
    
    # Configure logging
    if not app.debug:
        logging.basicConfig(level=logging.INFO)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(distributor_bp)
    
    # Create upload directories if they don't exist
    os.makedirs('static/distributor_logos', exist_ok=True)
    os.makedirs('static/user_profiles', exist_ok=True)
    
    @app.route('/')
    def index():
        return "Coolant Management API is running"
    
    return app
