NOTES
=====

Current Project Status
----------------------
Code for the incomplete (ill-fated?) attempt to switch from PopcornJS to VideoJS remains in the 'alt-player' branch. There are several problems stopping this from being successful.

One is a conflict between the modern version of VideoJS and the older development version used by PopcornJS. Currently one of them must be commented out in index.html to prevent the conflict. If Popcorn's version is used the annotation editor will work correctly as will the old player (at milo.byu.edu/video/<id>). If the new VideoJS version is used, the editor will not work, but the new player can be found at milo.byu.edu/altvid/<id>.

The ClipList system is only implemented on the older Popcorn-based player.

Git Submodules
--------------
The hummedia-client repo contains references to several other repositories, including byu-hummedia-api and odh-popcorn-plugins. These will NOT be pulled down automatically when you clone hummedia-client. To get them, run the command "git submodule update --init --recursive" from the top-level directory of the hummedia-client repo. You will only need to do this once when you initially clone the repository. If you get an error message (in the browser) about not being able to find AngularJS, it is likely that the sub-modules haven't been pulled down correctly. Try running the earlier command again.

Remember that this means that those repositories will be independent Git repositories nested inside the hummedia-client repo. The sub-repositories have their own branches and operate independently from the parent repository. If you make changes to byu-hummedia-api (mounted at api/flask) they will need to be committed and pushed up separately. After sub-repositories have been changed, the outer repository will mark the entire directory (api/flask, for example) as being changed. Adding and this "change" to a commit in the parent repo marks it as depending on that commit of the child repo. This can be confusing. Read up on Git submodules for more information.

Vagrant
-------
You'll need Vagrant installed on your development machine. Vagrant will configure and run a VirtualBox-based VM that will include everything you need to run a local (development) copy of HUMMedia.

Once Vagrant is installed, run the commands
"vagrant plugin install vagrant-hostsupdater" and 
"vagrant up"
in the hummedia-client repo's top-level directory.

This will start up the VM and forward the host https://milo.byu.edu to the VM on your machine.

When you're finished working on HUMMedia for the day, run "vagrant suspend" to pause the VM and "vagrant resume" to start it up again. If you need to completely stop the VM you can use "vagrant halt" and start it again using "vagrant up".

You can also run the command "vagrant ssh" to SSH into the Vagrant VM. The hummedia-client repo will be mounted in the VM at /vagrant.

Testing Changes
---------------
Any changes made to the frontend (anything in the 'app' directory) should be available with a page refresh in the browser. Note that you may often see errors in the JavaScript console about the Flickr key being rejected. This is because the repo doesn't contain a valid Flickr key. Just ignore this, as it doesn't cause any functional problems.

Changes to the backend (anything Python-based and in the 'api' directory) will require a server reboot. SSH into the VM (using "vagrant ssh") and use the command "sudo service apache2 restart". This will restart the backend.

Any errors happening on the backend will be logged in 'api/flask/flask_err.log'. This can be useful if you get a 500 error. This log will not be cleared when the server is rebooted, so you may want to clear it manually from time to time.

Database Problems
-----------------
You may also want to restore the database if it has bad data from development. Inside the 'api/db' directory there is a script called resetdatabase.sh. Run it with "sh resetdatabase.sh". This will restore it to its default condition.

Also note that you may see errors from time to time about fields missing for some media items in the database. While these are irritating, they don't seem to be happening in production. It is probably because the default data in 'api/db/<whatever>.json' are incomplete.

Ingestion Errors
----------------
The ingestion system (where new media files are uploaded to HUMMedia by lab attendants) also does not work as set up by Vagrant. To get this working (which you may not need to) requires a few manual steps.

First, SSH into the VM ("vagrant ssh") and run the following commands:
"sudo apt-get install libjpeg-dev libav-tools"
"sudo pip install pillow"

Then, while still SSHed in, change the permissions on the file /var/www/api/ingest/ingest-me.mp4 with "chmod 666 /var/www/api/ingest/ingest-me.mp4".

Finally, change the line in 'api/hummedia/config.py' starting with POSTERS_DIRECTORY to POSTER_DIRECTORY.

There may be further changes needed, but this should get most of the way.

