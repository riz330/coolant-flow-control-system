
# Coolant Management System - Deployment Guide

This guide details how to deploy the Coolant Management System on an AWS VM or similar environment.

## Prerequisites

- AWS EC2 instance (Ubuntu 20.04 LTS recommended)
- Domain name (optional)
- SSH access to the server

## 1. Server Setup

### 1.1 Update Server
```bash
sudo apt update
sudo apt upgrade -y
```

### 1.2 Install Required Packages
```bash
sudo apt install -y python3-pip python3-venv nginx postgresql postgresql-contrib
```

### 1.3 Create a PostgreSQL User and Database
```bash
sudo -u postgres psql

# In PostgreSQL console
CREATE DATABASE coolant_management;
CREATE USER coolant_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE coolant_management TO coolant_user;
\q
```

## 2. Application Deployment

### 2.1 Clone the repository
```bash
cd /var/www
sudo git clone <your-repository-url> coolant
sudo chown -R ubuntu:ubuntu /var/www/coolant
cd coolant
```

### 2.2 Setup Backend

#### Create Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Configure Database Connection
Edit `db_config.py` to match your PostgreSQL configuration:

```python
DB_CONFIG = {
    'host': 'localhost',
    'database': 'coolant_management',
    'user': 'coolant_user',
    'password': 'your_secure_password',
    'port': 5432
}
```

#### Initialize Database
```bash
sudo -u postgres psql coolant_management < sql/ddl/01_create_tables.sql
sudo -u postgres psql coolant_management < sql/ddl/02_constraints.sql
```

#### Create Static Directories
```bash
mkdir -p static/distributor_logos
mkdir -p static/user_profiles
chmod -R 755 static
```

### 2.3 Setup Frontend

#### Install Node.js (if not already installed)
```bash
curl -sL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt install -y nodejs
```

#### Build Frontend
```bash
cd ../frontend
npm install
npm run build
```

## 3. Configure Web Server (Nginx)

### 3.1 Create Nginx Configuration
```bash
sudo nano /etc/nginx/sites-available/coolant
```

Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Change to your domain or IP

    location / {
        root /var/www/coolant/frontend/dist;  # Adjust path if different
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static {
        alias /var/www/coolant/backend/static;
    }
}
```

### 3.2 Enable the Configuration
```bash
sudo ln -s /etc/nginx/sites-available/coolant /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

## 4. Set Up Gunicorn

### 4.1 Install Gunicorn
```bash
cd /var/www/coolant/backend
source venv/bin/activate
pip install gunicorn
```

### 4.2 Create Systemd Service
```bash
sudo nano /etc/systemd/system/coolant.service
```

Add the following configuration:

```ini
[Unit]
Description=Coolant Management System
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/var/www/coolant/backend
Environment="PATH=/var/www/coolant/backend/venv/bin"
ExecStart=/var/www/coolant/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5000 "app.app:create_app()"
Restart=always

[Install]
WantedBy=multi-user.target
```

### 4.3 Start and Enable the Service
```bash
sudo systemctl start coolant
sudo systemctl enable coolant
sudo systemctl status coolant  # Check status
```

## 5. Secure with SSL (Optional but Recommended)

### 5.1 Install Certbot
```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Obtain SSL Certificate
```bash
sudo certbot --nginx -d your-domain.com
```

## 6. Firewall Configuration

### 6.1 Configure UFW
```bash
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable
```

## 7. Maintenance and Updates

### 7.1 Update Application
```bash
cd /var/www/coolant
git pull origin main  # Or your main branch

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart coolant

# Update frontend
cd ../frontend
npm install
npm run build
```

### 7.2 Backup Database
```bash
pg_dump -U coolant_user -d coolant_management > coolant_backup_$(date +%Y%m%d).sql
```

## 8. Troubleshooting

### 8.1 Check Application Logs
```bash
sudo journalctl -u coolant
```

### 8.2 Check Nginx Logs
```bash
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/access.log
```

### 8.3 Restart Services
```bash
sudo systemctl restart coolant
sudo systemctl restart nginx
```

## 9. Security Considerations

- Set up automatic security updates
- Implement regular database backups
- Consider using a more restrictive firewall configuration
- Review and update user permissions regularly
