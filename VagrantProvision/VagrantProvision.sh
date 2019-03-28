#!/bin/bash

sudo su

systemctl stop apt-daily.timer
systemctl stop apt-daily-upgrade.timer

rm /var/lib/apt/lists/lock
rm /var/lib/dpkg/list

apt-get clean

# Disable release-upgrades
sed -i.bak 's/^Prompt=.*$/Prompt=never/' /etc/update-manager/release-upgrades;

# Remove unattended upgrades which block apt-get
apt-get -y purge unattended-upgrades

# Install nodejs
curl -sL https://deb.nodesource.com/setup_8.x | bash -
apt-get install -y nodejs


# Disable automatic screen lock
# @see http://ubuntuhandbook.org/index.php/2013/07/disable-screen-lock-ubuntu-13-04/
gsettings set org.gnome.desktop.screensaver lock-enabled false

# Disable auto screen turn off
# @see https://askubuntu.com/a/430394
gsettings set org.gnome.desktop.session idle-delay 0


# Set the language to german
apt-get install -y language-pack-de language-pack-gnome-de
update-locale LANG=de_DE.UTF-8

# Set the keyboard layout to german
localectl set-keymap de
localectl set-x11-keymap de

# Set system time to germany
timedatectl set-timezone Europe/Berlin


# TODO: Automatic npm install
#cd /home/vagrant/project
#npm install
