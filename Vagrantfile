# -*- mode: ruby -*-
# vi: set ft=ruby :

require 'io/console'
Vagrant.configure("2") do |config|
  hostname = ENV['VHOSTNAME'] || "milo.byu.edu"

  config.vm.box = "precise32"
  # The url from where the 'config.vm.box' box will be fetched if it
  # doesn't already exist on the user's system.
  config.vm.box_url = "http://files.vagrantup.com/precise32.box"

  args = hostname

  if ENV['ROBOT'] # This is for Jenkins
    config.vm.network "forwarded_port", guest: 80, host: 8888
    config.vm.network "forwarded_port", guest: 443, host: 4433
    args += ' /var/www/production'
  else
    config.vm.network "private_network", ip: "192.168.99.99"
    config.hostsupdater.remove_on_suspend = true
    config.vm.hostname = hostname
  end

  config.vm.synced_folder "api/text", "/vagrant/api/text",
    :owner => "www-data", :group => "www-data"

  config.vm.provision :shell,
    :path => "vagrant_bootstrap.sh",
    :args => args
end
