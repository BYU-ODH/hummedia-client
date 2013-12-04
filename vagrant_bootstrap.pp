# Install all needed packages
package {'apache2':}
package {'mongodb':}
package {'python':}
package {'python-pip':}
package {'python-dev':}
package {'libxml2-dev':}
package {'libxslt1-dev':}
package {'gearman':}

file { '/var/www/':
    ensure => 'link',
    target => '/vagrant'
}

apache::mod { 'rewrite': }
apache::mod { 'ssl': }
apache::mod { 'wsgi': }
apache::mod { 'python': }

apache::vhost { 'zelda.local':
    port        => '443',
    servername  => 'zelda.local',
    docroot     => '/var/www/app',
    ssl         => true,
    ssl_key     => '/etc/ssl/private/ssl-cert-snakeoil.key',
    ssl_cert    => '/etc/ssl/certs/ssl-cert-snakeoil.pem',
    directories => [ { path => '/var/www/app', allow_override => ['All'] } ],
    wsgi_script_aliases => {'/api/v2' => '/var/www/api/flask/flask.wsgi'}
}

# create config file if it's absent
exec { 'cp CONFIG.default.js CONFIG.js':
   cwd     => '/var/www/app',
   creates => 'CONFIG.js'
   path    => ["/usr/bin", "/usr/sbin"]
}

# install all needed Python packages
package { 'flask':
    provider => pip
}

package { 'flask_oauth':
    provider => pip
}

package { 'mongokit':
    provider => pip
}

package { 'byu_ws_sdk':
    provider => pip
}

package { 'lxml':
    provider => pip
}

package { 'gearman':
    provider => pip
}

# Create the API configuration file
# TODO: make this less...long.
file { '/var/www/api/flask/hummedia/config.py':
    replace: false,
    content: "
        from flask import Response
        import os

        HOST='https://zelda.local'
        APIHOST=HOST+'/api/v2'
        REDIRECT_URI='/account/callback'

        CROSS_DOMAIN_HOSTS=['localhost']

        UNSUPPORTED_FORMAT=Response('That format is not currently supported.',status=400,mimetype='text/plain')
        NOT_FOUND=Response('That object could not be found.',status=404,mimetype='text/plain')
        BAD_REQUEST=Response('The request was malformed in some way.',status=400,mimetype='text/plain')
        UNAUTHORIZED=Response('You do not have permission to perform that action.',status=401,mimetype='text/plain')

        GOOGLE_CLIENT_ID = 'client.id.goes.here'
        GOOGLE_CLIENT_SECRET = 'client_secret_goes_here'
        GOOGLE_REDIRECT_URI=REDIRECT_URI+'?auth=google'

        CAS_SERVER  = 'https://cas.byu.edu'
        BYU_WS_ID = 'byu_ws_id_goes_here'
        BYU_SHARED_SECRET = 'byu_shared_secret_goes_here'

        SECRET_KEY = 'app_secret_goes_here'
        COOKIE_NAME = 'hummedia-session'
        COOKIE_DOMAIN = '.zelda.local'
        APPLICATION_ROOT = '/'

        MONGODB_DB = 'hummedia'
        MONGODB_HOST = 'localhost'
        MONGODB_PORT = 27017

        GOOGLE_API_KEY = 'GoogleAPIKeyHere'
        YT_SERVICE = 'https://www.googleapis.com/youtube/v3/videos?part=snippet&key='+GOOGLE_API_KEY

        GEARMAN_SERVERS = ['localhost:4730'] # specify host and port

        INGEST_DIRECTORY = '/var/www/api/ingest/' # where ingestable media are found
        MEDIA_DIRECTORY = '/var/www/api/movies/' # where ingested media should be moved to
        POSTER_DIRECTORY = '/var/www/api/posters/'"
}
    

# Get the ingest script up and running
file { '/etc/init/hummedia_ingest.conf':
    content => "
        start on runlevel [2345]
        stop on runlevel [!2345]

        respawn

        script
            # Startup ingest.py and the recordingqueue command
            # this should be the full path of your ingest executable module, under your hummedia project
            exec sudo -g video /var/www/api/flask/ingest.py
        end script" 
}

file { '/etc/init.d/hummedia_ingest':
    ensure => link,
    target => '/lib/init/upstart-job',
}

service { 'hummedia_ingest':
    ensure   => running,
    provider => 'upstart',
    require  => File['/etc/init.d/hummedia_ingest']
}

file { '/var/www/api/flask/flask_err.log',
    chmod   => 'ugo+w', # TODO: this should be less open
    replace => false,
    ensure  => present
}


