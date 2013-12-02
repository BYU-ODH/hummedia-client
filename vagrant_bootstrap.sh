#!/bin/bash

apt-get update
apt-get install -y apache2 mongodb python libapache2-mod-python libapache2-mod-wsgi python-pip python-dev libxml2-dev libxslt1-dev gearman

rm -rf /var/www
ln -fs /vagrant /var/www

a2enmod rewrite ssl wsgi python

cat << 'EOF' > /etc/apache2/sites-available/zelda.local
<VirtualHost *:443>
    ServerName zelda.local

    DocumentRoot /var/www/app
    
    <Directory /var/www/app/>
        AllowOverride All
    </Directory>

    SSLEngine On
    SSLCertificateFile /etc/ssl/certs/ssl-cert-snakeoil.pem
    SSLCertificateKeyFile /etc/ssl/private/ssl-cert-snakeoil.key

    WSGIPassAuthorization On
    WSGIScriptAlias /api/v2 /var/www/api/flask/flask.wsgi
</VirtualHost>
EOF

if [ ! -f /var/www/app/CONFIG.js ]; then
    cp /var/www/app/CONFIG.default.js /var/www/app/CONFIG.js
fi



###############
#
# SET UP API
#
################

if [ ! -f /var/www/api/flask/hummedia/config.py ]; then

    # create config file (if it doesn't already exist)
    cat << 'EOF' > /var/www/api/flask/hummedia/config.py
from flask import Response
import os

HOST="https://zelda.local"
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
COOKIE_DOMAIN = ".zelda.local"
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
EOF

fi

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

rm -rf real_files ingest movies posters
mkdir real_files
mkdir ingest
mkdir movies
mkdir posters

cd real_files

# download some sample MP4s and webms
wget http://video.webmfiles.org/big-buck-bunny_trailer.webm -O trailer.webm --no-verbose
wget http://video.blendertestbuilds.de/download.blender.org/peach/trailer_480p.mov -O trailer.mp4 --no-verbose

cd ../ingest

wget http://ftp.nluug.nl/ftp/graphics/blender/apricot/trailer/sintel_trailer-480p.mp4 -O ingest-me.mp4 --no-verbose

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
        ln -s ../real_files/trailer.webm "${FILE}.webm"
        ln -s ../real_files/trailer.mp4 "${FILE}.mp4"
    fi
done

# ALL SYSTEMS GO
a2ensite zelda.local
service hummedia_ingest start
service apache2 restart
