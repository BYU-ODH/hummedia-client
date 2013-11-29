#!/bin/bash

apt-get update
apt-get install -y apache2 mongodb python libapache2-mod-python libapache2-mod-wsgi python-pip python-devel \
                   libxml2-dev libxlst1-dev gcc
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

rm -rf real_files ingest movies
mkdir real_files
mkdir ingest
mkdir movies

cd real_files

# download some sample MP4s and webms
wget http://video.webmfiles.org/big-buck-bunny_trailer.webm -O trailer.webm
wget http://video.blendertestbuilds.de/download.blender.org/peach/trailer_480p.mov -O trailer.mp4

cd ../ingest

wget http://ftp.nluug.nl/ftp/graphics/blender/apricot/trailer/sintel_trailer-480p.mp4 -O ingest-me.mp4

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
service apache2 restart
