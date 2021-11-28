#!/bin/bash
yum update -y
amazon-linux-extras install docker
service docker start
usermod -a -G docker ec2-user
chkconfig docker on

sudo curl -L "https://github.com/docker/compose/releases/download/1.29.2/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

echo 'Start creating deployment script...'
rm -rf /home/ec2-user/deploy.sh
cat > '/home/ec2-user/deploy.sh' <<- EOM
#!/bin/bash

`aws ecr get-login --no-include-email --region ap-east-1`
docker-compose rm -f
docker-compose pull
docker-compose up -d
EOM

sudo chmod 755 /home/ec2-user/deploy.sh

echo 'Start creating docker compose script...'
rm -rf /home/ec2-user/docker-compose.yml
cat > '/home/ec2-user/docker-compose.yml' <<- EOM
version: "3.9"
services:
  web:
    image: xxxx.dkr.ecr.ap-east-1.amazonaws.com/aws-training-backend:latest
    tty: true
    user: root
    ports:
      - "8080:8080"
EOM

sudo chmod 755 /home/ec2-user/docker-compose.yml
