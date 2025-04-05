
from flask import Flask
from flask_cors import CORS
import os
from dotenv import load_dotenv

from .routes.auth_routes import auth_bp
from .routes.profile_routes import profile_bp
from .routes.client_routes import client_bp
from .routes.distributor_routes import distributor_bp

def create_app():
    load_dotenv()
    
    app = Flask(__name__, static_folder='../static')
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
    CORS(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp)
    app.register_blueprint(profile_bp)
    app.register_blueprint(client_bp)
    app.register_blueprint(distributor_bp)
    
    @app.route('/')
    def home():
        return 'Coolant Flow Control System API'
    
    return app
