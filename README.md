HUMMEDIA
=========

Starting Off
--------------
This project can be set up using [Vagrant](http://docs.vagrantup.com/v2/).

* `$ apt-get install vagrant`
* `$ vagrant plugin install vagrant-hostsupdater`
* `$ vagrant up`

The virtual machine will run on IP 192.168.99.99. This can be changed in the Vagrantfile if necessary.

You can access the website at [https://milo.byu.edu](https://milo.byu.edu). While the Vagrant box is running,
your hosts file will be updated to point to the virtual machine. Suspend the virtual machine to remove the changes
to the hosts file.

Configure the website by editing `app/CONFIG.js` and
`api/flask/hummedia/config.py`

Adding Plugins
-----------------------
We are using the [Popcorn Plugins submodule](https://bitbucket.org/htrscdev/popcorn-plugins) to store our plugins. To load additional plugins,
include them on both the `index.html` file as well as the Butter configuration file under `app/lib/butter/src/default-config.json`

Production Prep
------------------------
*REQUIREMENTS*

    *    nodejs
    *    npm

By adding a `data-cdn` attribute to your `<script>` tags in the index.html file, 
by running `ant compress` each one will have its `src` attribute take the value of
its `data-cdn` attribute. This can be used on production to speed up response time.

A `data-exclude-compress` attribute will exclude a file from compression.

By adding a `data-remove` attribute to your `<script>` tags, the `ant compress` command
will delete the `<script>` tags with these attributes.

By running `ant compress`, all of your LESS files will be compiled into a single CSS file.

Testing
-------

### E2E Tests
To run E2E tests, call `ant test` from the root directory. By default it will use the file `config/testacular-e2e.conf.js` as the configuration file. However, this can be overridden by calling `ant test -De2e.config=YOUR_CUSTOM_FILE`

To get these to work with browserstack, you'll need to save the following as an executable `~/.browserstack_config.sh`

* `touch ~/.browserstack_config.sh`
* `chmod +x ~/.browserstack_config.sh`

Then edit the `~/.browserstack_config.sh` file with these contents:

    USERNAME=your_browserstack_username
    AUTOMATED_TESTING_KEY=your_testing_key
    PASSWORD=your_password
