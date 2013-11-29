#!/bin/bash

apt-get update
apt-get install -y apache2 mongodb python libapache2-mod-python libapache2-mod-wsgi
rm -rf /var/www
ln -fs /vagrant /var/www

a2enmod rewrite ssl wsgi python

cat << 'EOF' > /etc/apache2/sites-available/zelda.byu.edu
<VirtualHost *:443>
    ServerName zelda.local

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

a2ensite zelda.local
service apache2 restart


###############
#
# SET UP API
#
################

cd /var/www/api/

mkdir real_files
mkdir ingest
mkdir movies

cd real_files

# download some sample MP4s and webms
wget http://video.webmfiles.org/big-buck-bunny_trailer.webm -O trailer.webm
wget http://video.blendertestbuilds.de/download.blender.org/peach/trailer_480p.mov -O trailer.mp4

cd ../ingest

rm ingest-me.mp4
wget http://ftp.nluug.nl/ftp/graphics/blender/apricot/trailer/sintel_trailer-480p.mp4 -O ingest-me.mp4

# initialize the database
cd ../db
mongoimport --database hummedia --collection annotations --file annotations.json
mongoimport --database hummedia --collection users --file users.json
mongoimport --database hummedia --collection assets --file assets.json
mongoimport --database hummedia --collection assetgroups --file assetgroups.json

# go through each file we reference in the database and symlink it to a real file
FILES=`mongo hummedia --eval "db.assets.find().forEach(function(a){ if(a[\"@graph\"][\"ma:locator\"][0][\"@id\"]){ print(a[\"@graph\"][\"ma:locator\"])}})"

cd ../movies

rm *.webm *.mp4
for FILE in $FILES; do
    ln -s ../real_files/trailer.webm "${FILE}.webm"
    ln -s ../real_files/trailer.mp4 "${FILE}.mp4"
done

