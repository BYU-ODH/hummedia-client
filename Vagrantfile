# -*- mode: ruby -*-
# vi: set ft=ruby :

require 'io/console'
Vagrant.configure("2") do |config|
  config.vm.box = "precise32"
  # The url from where the 'config.vm.box' box will be fetched if it
  # doesn't already exist on the user's system.
  config.vm.box_url = "http://files.vagrantup.com/precise32.box"

  config.vm.provision :shell, :path => "vagrant_bootstrap.sh"
  config.vm.network "private_network", ip: "192.168.99.99"

  config.hostsupdater.remove_on_suspend = true
  config.vm.hostname = "milo.byu.edu"
end
