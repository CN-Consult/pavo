Vagrant.configure("2") do |config|

  config.vm.box = "blagojs/ubuntu-xenial-unity-amd64"

  config.vm.network :forwarded_port, guest: 8080, host: 8080

  config.vm.provision "shell", path: "VagrantProvision/VagrantProvision.sh"
  config.vm.provision "shell", path: "VagrantProvision/linkProjectToVirtualMachineFolder.sh"

  # For this line you have to install the plugin vagrant-reload with "vagrant plugin install vagrant-reload"
  config.vm.provision :reload

  config.vm.provider "virtualbox" do |vb|

      vb.customize [ "modifyvm", :id, "--vram", "50" ]
      vb.customize [ "modifyvm", :id, "--cpuexecutioncap", "60"]

      vb.memory = 2056
      vb.cpus = 4

      vb.gui = true
  end

end
