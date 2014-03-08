#!/bin/bash

HOSTNAME=$1
DOCROOT=$2

if [[ -z "$HOSTNAME" ]]; then
  HOSTNAME="milo.byu.edu"
fi

if [[ -z "$DOCROOT" ]]; then
  DOCROOT="/var/www/app"
fi

apt-get update
apt-get install -y apache2 mongodb python libapache2-mod-python libapache2-mod-wsgi python-pip python-dev libxml2-dev libxslt1-dev gearman imagemagick make automake apache2-threaded-dev

rm -rf /var/www
ln -fs /vagrant /var/www

# Download the authentication module
cd /tmp
rm -rf mod_auth_token*
wget https://mod-auth-token.googlecode.com/files/mod_auth_token-1.0.6-beta.tar.gz
tar -xvzf mod_auth_token-1.0.6-beta.tar.gz
chmod +x mod_auth_token
cd mod_auth_token
chmod +x configure
# symlinks are incorrect; need to patch them
ln -fs /usr/share/automake-1.11/config.guess config.guess
ln -fs /usr/share/automake-1.11/config.sub config.sub
ln -fs /usr/share/automake-1.11/COPYING COPYING
ln -fs /usr/share/automake-1.11/install-sh install-sh
ln -fs /usr/share/automake-1.11/missing missing
# configure auth module's Makefile and build
./configure
make install # will automatically enable it

a2enmod rewrite ssl wsgi python

cat << EOF > /etc/apache2/sites-available/milo.byu.edu
<VirtualHost *:443>
    AddDefaultCharset UTF-8
    AddType 'text/vtt; charset=UTF-8' .vtt
    AddType 'text/plain; charset=UTF-8' .srt

    ServerName $HOSTNAME

    DocumentRoot $DOCROOT
    
    <Directory $DOCROOT/>
        AllowOverride All
    </Directory>
    
    Alias /movies/ /var/www/api/movies/ 
    <Location /movies/>
        AuthTokenSecret     "secret string"
        AuthTokenPrefix     /movies/
        
        #4 hours 
        AuthTokenTimeout    14400 
        AuthTokenLimitByIp  on
    </Location>

    SSLEngine On
    SSLCertificateFile /etc/ssl/certs/ssl-cert-snakeoil.pem
    SSLCertificateKeyFile /etc/ssl/private/ssl-cert-snakeoil.key

    WSGIPassAuthorization On
    WSGIScriptAlias /api/v2 /var/www/api/flask/flask.wsgi

    AliasMatch ^/posters/.*([0-9])_thumb.jpg$ /var/www/api/posters/\$1_thumb.jpg
    AliasMatch ^/posters/.*([0-9]).jpg$ /var/www/api/posters/\$1.jpg
    AliasMatch ^/posters/(.*)$ /var/www/api/posters/\$1

    RewriteEngine On
    
    RewriteRule ^/text/(.*)$ /var/www/api/text/\$1
    RewriteMap subtitles rnd:/etc/apache2/maps/subtitles.txt
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_URI} ^/text/.*
    RewriteRule ^.*.(srt|vtt)$ /var/www/api/text/\${subtitles:file}.\$1 [L] 
</VirtualHost>
EOF

if [ ! -f $DOCROOT/CONFIG.js ]; then
    cp $DOCROOT/CONFIG.default.js $DOCROOT/CONFIG.js
fi

# Allows for randomly selecting subtitles when they don't exist
mkdir -p /etc/apache2/maps/
echo "file teenagers|gulliver|santa" > /etc/apache2/maps/subtitles.txt



###############
#
# SET UP API
#
################

# create config file (if it doesn't already exist)
cat << EOF > /var/www/api/flask/hummedia/config.py
from flask import Response
import os

HOST="https://$HOSTNAME"
APIHOST=HOST+"/api/v2"
REDIRECT_URI="/account/callback"

CROSS_DOMAIN_HOSTS=['localhost']

UNSUPPORTED_FORMAT=Response("That format is not currently supported.",status=400,mimetype="text/plain")
NOT_FOUND=Response("That object could not be found.",status=404,mimetype="text/plain")
BAD_REQUEST=Response("The request was malformed in some way.",status=400,mimetype="text/plain")
UNAUTHORIZED=Response("You do not have permission to perform that action.",status=401,mimetype="text/plain")

GOOGLE_CLIENT_ID = 'client.id.goes.here'
GOOGLE_CLIENT_SECRET = 'client_secret_goes_here'
GOOGLE_REDIRECT_URI=REDIRECT_URI+"?auth=google"

CAS_SERVER  = "https://cas.byu.edu"
BYU_WS_ID = "byu_ws_id_goes_here"
BYU_SHARED_SECRET = "byu_shared_secret_goes_here"

SECRET_KEY = 'app_secret_goes_here'
COOKIE_NAME = 'hummedia-session'
COOKIE_DOMAIN = ".$HOSTNAME"
APPLICATION_ROOT = "/"

MONGODB_DB = 'hummedia'
MONGODB_HOST = 'localhost'
MONGODB_PORT = 27017

GOOGLE_API_KEY = "GoogleAPIKeyHere"
YT_SERVICE = "https://www.googleapis.com/youtube/v3/videos?part=snippet&key="+GOOGLE_API_KEY

GEARMAN_SERVERS = ['localhost:4730'] # specify host and port

INGEST_DIRECTORY = "/var/www/api/ingest/" # where ingestable media are found
MEDIA_DIRECTORY = "/var/www/api/movies/" # where ingested media should be moved to
POSTER_DIRECTORY = "/var/www/api/posters/"

AUTH_TOKEN_SECRET      = "secret string"
AUTH_TOKEN_PREFIX      = "/movies/"
AUTH_TOKEN_IP          = True
EOF

# Create ingest service
cat << 'EOF' > /etc/init/hummedia_ingest.conf
# Upstart configuration file that spawns the Hummedia Webm transcoding queue process
# Requires upstart.
# This keeps the queue running in the background. If it dies, it brings it back up again

description     "python webm transcoding queue daemon for hummedia"

start on runlevel [2345]
stop on runlevel [!2345]

respawn

script
    # Startup ingest.py and the recordingqueue command
    # this should be the full path of your ingest executable module, under your hummedia project
    exec sudo -g video /var/www/api/flask/ingest.py
end script
EOF

# prepare error log for www-data writing
# (I can't figure out how to change any user/group from vagrant to www-data; probably a mount thing)
touch /var/www/api/flask/flask_err.log
chmod ugo+w /var/www/api/flask/flask_err.log

# install all required python modules
pip install flask
pip install flask_oauth
pip install mongokit
pip install byu_ws_sdk
pip install lxml
pip install gearman

cd /var/www/api/

#rm -rf real_files ingest movies posters
mkdir -p real_files
mkdir -p ingest
mkdir -p movies
mkdir -p posters

cd real_files

# download some sample MP4s and webms
if [ ! -f trailer.webm ]; then
    wget http://video.webmfiles.org/big-buck-bunny_trailer.webm -O trailer.webm --no-verbose
fi

if [ ! -f trailer.mp4 ]; then
    wget http://video.blendertestbuilds.de/download.blender.org/peach/trailer_480p.mov -O trailer.mp4 --no-verbose
fi

cd ../ingest

if [ ! -f ingest-me.mp4 ]; then
    wget https://archive.org/download/Video_Diary__Short_Version_PSP/MAQ11112_512kb.mp4 -O ingest-me.mp4 --no-verbose
fi

# initialize the database
cd ../db
mongoimport --db hummedia --collection annotations --file annotations.json
mongoimport --db hummedia --collection users --file users.json
mongoimport --db hummedia --collection assets --file assets.json
mongoimport --db hummedia --collection assetgroups --file assetgroups.json

echo "Sleeping five seconds to make sure all mongo data is imported correctly."

# go through each file we reference in the database and symlink it to a real file
FILES=`mongo hummedia /var/www/scripts/get_video_filenames.js`

cd ../movies

for FILE in $FILES; do
    if [[ ${#FILE} -gt 0 ]]; then
        ln -s ../real_files/trailer.webm "${FILE}.webm" > /dev/null 2>&1
        ln -s ../real_files/trailer.mp4 "${FILE}.mp4" > /dev/null 2>&1
    fi
done

# Download images
cd ../posters
for i in $(seq 0 9); do wget https://placeimg.com/300/200/any -O $i.jpg; done
GLOBIGNORE=*thumb.jpg
convert -format jpg -thumbnail 100x150 *.jpg -set filename:f '%t_thumb.%e' '%[filename:f]'

cat << 'EOF' > /etc/init/flask_watcher.conf
description     "Restarts Apache when Flask files are changed"

start on runlevel [2345]
stop on runlevel [!2345]

respawn

script
    exec /var/www/scripts/restartApache.sh
end script
EOF

# ALL SYSTEMS GO
rm /etc/apache2/sites-enabled/* # kill any vestiges from previous provisions
a2ensite milo.byu.edu
service hummedia_ingest restart
service apache2 restart
service flask_watcher restart
