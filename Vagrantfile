# This Vagrantfile requires you to install the plugin vagrant-reload with "vagrant plugin install vagrant-reload"

Vagrant.configure("2") do |config|

  config.vm.network :forwarded_port, guest: 8080, host: 8080

  # Provision
  config.vm.provision "shell", path: "VagrantProvision/removeUnattendedUpgrades.sh"
  config.vm.provision :reload

  config.vm.provision "shell", path: "VagrantProvision/VagrantProvision_default.sh"

  config.vm.define "ubuntu22", primary: true, autostart: true do |ubuntu22|
    ubuntu22.vm.box = "fasmat/ubuntu2204-desktop"
    ubuntu22.vm.provision "shell", path: "VagrantProvision/VagrantProvision_ubuntu22.sh"
    ubuntu22.vm.provision :reload
  end

  config.vm.define "ubuntu18", primary: false, autostart: false do |ubuntu18|
    ubuntu18.vm.box = "pega-squid/ubuntu-18.04.1-desktop"
    ubuntu18.vm.provision "shell", path: "VagrantProvision/VagrantProvision_ubuntu18.sh"
    ubuntu18.vm.provision :reload
  end

  config.vm.define "ubuntu16", primary: false, autostart: false do |ubuntu16|
    ubuntu16.vm.box = "blagojs/ubuntu-xenial-unity-amd64"
    ubuntu16.vm.provision "shell", path: "VagrantProvision/VagrantProvision_ubuntu16.sh"
    ubuntu16.vm.provision :reload
  end

  config.vm.provision "shell", path: "VagrantProvision/linkProjectToVirtualMachineFolder.sh"
  config.vm.provision "shell", path: "VagrantProvision/installProjectDependencies.sh"

  config.vm.provider "virtualbox" do |vb|
      vb.name = "Pavo Development"
      vb.customize [ "modifyvm", :id, "--vram", "50" ]
      vb.customize [ "modifyvm", :id, "--cpuexecutioncap", "60"]

      vb.memory = 2048
      vb.cpus = 4

      vb.gui = true
  end

end
