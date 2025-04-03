
# Coolant Management System - Deployment Guide

This document provides instructions for deploying the Coolant Management System to an AWS VM.

## Prerequisites

- Access to an AWS account
- SSH key pair for accessing the EC2 instance
- Domain name (optional)

## AWS VM Setup

### 1. Launch an EC2 Instance

1. Log in to the AWS Management Console
2. Navigate to EC2 and click "Launch Instance"
3. Choose an Amazon Machine Image (AMI):
   - Recommended: Ubuntu Server 22.04 LTS
4. Choose an Instance Type:
   - Recommended: t2.medium (2 vCPU, 4 GiB RAM)
5. Configure Instance Details:
   - Default VPC is fine for most cases
   - Enable auto-assign public IP
6. Add Storage:
   - Increase the default storage to at least 20 GB
7. Add Tags (optional):
   - Key: Name, Value: Coolant-Management-System
8. Configure Security Group:
   - Create a new security group
   - Allow SSH (port 22) from your IP
   - Allow HTTP (port 80) from anywhere
   - Allow HTTPS (port 443) from anywhere
9. Review and Launch
10. Select an existing key pair or create a new one

### 2. Connect to the Instance

```bash
ssh -i /path/to/your-key.pem ubuntu@your-instance-public-ip
```

### 3. Update System Packages

```bash
sudo apt update
sudo apt upgrade -y
```

### 4. Install Required Software

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Python and dependencies
sudo apt install -y python3-pip python3-dev python3-venv build-essential libssl-dev libffi-dev

# Install Nginx
sudo apt install -y nginx

# Install Git
sudo apt install -y git
```

### 5. Configure PostgreSQL

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database
createdb coolant_management

# Create user with password
psql -c "CREATE USER coolant_user WITH PASSWORD 'your_password_here';"

# Grant privileges
psql -c "GRANT ALL PRIVILEGES ON DATABASE coolant_management TO coolant_user;"

# Exit postgres user
exit
```

## Application Deployment

### 1. Clone the Repository

```bash
cd /opt
sudo mkdir coolant
sudo chown ubuntu:ubuntu coolant
cd coolant
git clone https://your-repository-url.git .
```

### 2. Set Up Backend

```bash
cd backend

# Create a virtual environment
python3 -m venv venv

# Activate the virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Update db_config.py with your PostgreSQL credentials
sudo nano db_config.py
```

Update the configuration to match your AWS environment:

```python
# Database configuration settings
DB_CONFIG = {
    'host': 'localhost',
    'database': 'coolant_management',
    'user': 'coolant_user',
    'password': 'your_password_here',
    'port': 5432
}
```

### 3. Initialize the Database

```bash
# Execute DDL scripts
psql -U coolant_user -d coolant_management -a -f sql/ddl/01_create_tables.sql
psql -U coolant_user -d coolant_management -a -f sql/ddl/02_constraints.sql

# Load sample data
psql -U coolant_user -d coolant_management -a -f sql/sample_data.sql
```

### 4. Set Up Frontend

```bash
cd ../frontend

# Install dependencies
npm install

# Build the frontend
npm run build
```

### 5. Configure Gunicorn for the Backend

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/coolant-backend.service
```

Add the following content:

```
[Unit]
Description=Coolant Management System Backend
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/opt/coolant/backend
Environment="PATH=/opt/coolant/backend/venv/bin"
ExecStart=/opt/coolant/backend/venv/bin/gunicorn --workers 3 --bind 127.0.0.1:5000 run:app

[Install]
WantedBy=multi-user.target
```

Start and enable the service:

```bash
sudo systemctl start coolant-backend
sudo systemctl enable coolant-backend
```

### 6. Configure Nginx

Create a new Nginx configuration file:

```bash
sudo nano /etc/nginx/sites-available/coolant
```

Add the following content:

```
server {
    listen 80;
    server_name your_domain.com; # Replace with your domain or server IP

    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location / {
        root /opt/coolant/frontend/build;
        try_files $uri $uri/ /index.html;
    }
}
```

Create a symbolic link:

```bash
sudo ln -s /etc/nginx/sites-available/coolant /etc/nginx/sites-enabled/
```

Test Nginx configuration:

```bash
sudo nginx -t
```

If the test is successful, restart Nginx:

```bash
sudo systemctl restart nginx
```

### 7. Set Up SSL with Let's Encrypt (Optional)

Install Certbot:

```bash
sudo apt install -y certbot python3-certbot-nginx
```

Obtain and install SSL certificate:

```bash
sudo certbot --nginx -d your_domain.com
```

Follow the prompts to complete the SSL setup.

## File Storage Setup

Create directories for storing uploaded files:

```bash
sudo mkdir -p /opt/coolant/uploads/client_logos
sudo mkdir -p /opt/coolant/uploads/distributor_logos
sudo mkdir -p /opt/coolant/uploads/user_profiles

sudo chown -R ubuntu:www-data /opt/coolant/uploads
sudo chmod -R 775 /opt/coolant/uploads
```

## Monitoring and Maintenance

### 1. Check Application Status

```bash
# Check backend service status
sudo systemctl status coolant-backend

# Check Nginx status
sudo systemctl status nginx

# View backend logs
sudo journalctl -u coolant-backend
```

### 2. Database Backup

Create a backup script:

```bash
sudo nano /opt/coolant/backup.sh
```

Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/opt/coolant/backups"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="$BACKUP_DIR/coolant_backup_$TIMESTAMP.sql"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Perform backup
pg_dump -U coolant_user -d coolant_management > $BACKUP_FILE

# Compress the backup
gzip $BACKUP_FILE

# Remove backups older than 30 days
find $BACKUP_DIR -type f -name "*.sql.gz" -mtime +30 -delete
```

Make the script executable:

```bash
sudo chmod +x /opt/coolant/backup.sh
```

Set up a daily cron job:

```bash
sudo crontab -e
```

Add the following line:

```
0 2 * * * /opt/coolant/backup.sh
```

This will run the backup every day at 2:00 AM.

## Troubleshooting

### Common Issues and Solutions

1. **Application not accessible:**
   - Check if backend service is running: `sudo systemctl status coolant-backend`
   - Check if Nginx is running: `sudo systemctl status nginx`
   - Verify security group settings in AWS console

2. **Database connection issues:**
   - Verify database credentials in `db_config.py`
   - Check if PostgreSQL is running: `sudo systemctl status postgresql`
   - Check PostgreSQL logs: `sudo tail -f /var/log/postgresql/postgresql-12-main.log`

3. **File upload issues:**
   - Check permissions on upload directories
   - Verify that nginx user has write access: `sudo -u www-data touch /opt/coolant/uploads/test.txt`

4. **SSL certificate issues:**
   - Renew certificate: `sudo certbot renew`
   - Check certificate status: `sudo certbot certificates`

## Updating the Application

To update the application to a new version:

```bash
cd /opt/coolant

# Pull the latest changes
git pull

# Update backend
cd backend
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart coolant-backend

# Update frontend
cd ../frontend
npm install
npm run build
```

## Conclusion

The application should now be successfully deployed to your AWS VM. You can access it by navigating to your domain name or your instance's public IP address in a web browser.

For any further assistance, please refer to the project documentation or contact the development team.
