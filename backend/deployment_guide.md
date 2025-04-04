
# Deployment Guide for Coolant Management System

This guide provides instructions for deploying the Coolant Management System to an AWS VM. This is just a general guide; you'll need to adapt it to your specific VM configuration.

## Prerequisites

- An AWS VM with a Linux distribution (e.g., Ubuntu, Amazon Linux)
- SSH access to the VM
- sudo privileges on the VM
- A domain name (optional for production deployment)

## Part 1: Preparing the AWS VM

1. Connect to your AWS VM using SSH:

```bash
ssh -i path/to/key.pem ec2-user@your-vm-ip
```

2. Update the system:

```bash
sudo apt update && sudo apt upgrade -y  # For Ubuntu
# OR
sudo yum update -y  # For Amazon Linux
```

3. Install required packages:

```bash
# For Ubuntu
sudo apt install -y python3 python3-pip python3-venv nginx postgresql postgresql-contrib git

# For Amazon Linux
sudo yum install -y python3 python3-pip nginx postgresql postgresql-server postgresql-contrib git
```

## Part 2: Setting Up PostgreSQL

1. Initialize and start PostgreSQL:

```bash
# For Ubuntu, PostgreSQL should start automatically after installation

# For Amazon Linux
sudo postgresql-setup initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

2. Configure PostgreSQL:

```bash
sudo -i -u postgres
psql
```

3. Create the database and user:

```sql
CREATE DATABASE coolant_management;
CREATE USER coolantadmin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE coolant_management TO coolantadmin;
\q
exit
```

4. Apply the database schema:

```bash
# Assuming you've copied your SQL files to the VM
psql -U coolantadmin -d coolant_management -a -f /path/to/01_create_tables.sql
psql -U coolantadmin -d coolant_management -a -f /path/to/02_constraints.sql
```

## Part 3: Deploying the Backend

1. Clone your repository or upload your application files:

```bash
git clone https://your-repository-url.git
# OR transfer files using SCP, etc.
```

2. Set up the Python environment:

```bash
cd /path/to/backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. Update the database configuration:

```bash
# Edit db_config.py to use your AWS PostgreSQL settings
nano db_config.py
```

4. Set up Gunicorn for production deployment:

```bash
pip install gunicorn
```

5. Create a systemd service for the Flask application:

```bash
sudo nano /etc/systemd/system/coolant-backend.service
```

6. Add the following content to the service file:

```ini
[Unit]
Description=Coolant Management System Backend
After=network.target

[Service]
User=ec2-user
WorkingDirectory=/path/to/backend
Environment="PATH=/path/to/backend/venv/bin"
ExecStart=/path/to/backend/venv/bin/gunicorn run:app -b 127.0.0.1:5000 -w 4
Restart=always

[Install]
WantedBy=multi-user.target
```

7. Start and enable the service:

```bash
sudo systemctl start coolant-backend
sudo systemctl enable coolant-backend
```

## Part 4: Deploying the Frontend

1. Build the React application:

```bash
cd /path/to/frontend
npm install
npm run build
```

2. Configure Nginx:

```bash
sudo nano /etc/nginx/sites-available/coolant
```

3. Add the following configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com;  # Or the VM's IP address

    # Frontend (React)
    location / {
        root /path/to/frontend/dist;  # Path to your React build output
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

4. Enable the site and restart Nginx:

```bash
sudo ln -s /etc/nginx/sites-available/coolant /etc/nginx/sites-enabled/
sudo nginx -t  # Test the configuration
sudo systemctl restart nginx
```

## Part 5: Setting Up SSL (Optional but Recommended)

1. Install Certbot:

```bash
# For Ubuntu
sudo apt install -y certbot python3-certbot-nginx

# For Amazon Linux
sudo amazon-linux-extras install epel
sudo yum install -y certbot python-certbot-nginx
```

2. Obtain and configure SSL certificates:

```bash
sudo certbot --nginx -d your-domain.com
```

## Part 6: Security Considerations

1. Configure the AWS security group to allow only necessary ports:
   - HTTP (80) and HTTPS (443) for web access
   - SSH (22) for management
   - Restrict access to PostgreSQL port (5432)

2. Set up a firewall on the VM:

```bash
# For Ubuntu
sudo ufw allow 22
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable

# For Amazon Linux
sudo yum install -y firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

3. Make sure your application uses proper JWT security and doesn't expose sensitive information.

## Part 7: Maintenance

1. Set up log rotation:

```bash
sudo nano /etc/logrotate.d/coolant
```

2. Add the following configuration:

```
/path/to/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ec2-user ec2-user
}
```

3. Set up regular backups for your PostgreSQL database:

```bash
# Create a backup script
nano ~/backup-db.sh
```

4. Add the following content:

```bash
#!/bin/bash
BACKUP_DIR="/path/to/backups"
TIMESTAMP=$(date +"%Y%m%d%H%M%S")
pg_dump -U coolantadmin -d coolant_management -f "$BACKUP_DIR/coolant_db_$TIMESTAMP.sql"
```

5. Make the script executable and schedule it with cron:

```bash
chmod +x ~/backup-db.sh
crontab -e
```

6. Add the following line to run the backup daily at 2 AM:

```
0 2 * * * /home/ec2-user/backup-db.sh
```

## Conclusion

Your Coolant Management System should now be deployed on your AWS VM. Be sure to:

1. Regularly update your system and dependencies
2. Monitor system resources and logs
3. Back up your database regularly
4. Keep your SSL certificates up to date (they expire every 90 days)

For any deployment issues, check the logs at:
- Backend logs: `journalctl -u coolant-backend`
- Nginx logs: `/var/log/nginx/error.log` and `/var/log/nginx/access.log`
