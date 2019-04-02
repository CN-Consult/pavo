#!/bin/bash

# Install nodejs
curl -sL https://deb.nodesource.com/setup_8.x | bash -
apt-get install -y nodejs


# Set the language to german
apt-get install -y language-pack-de language-pack-gnome-de
update-locale LANG=de_DE.UTF-8

# Set the keyboard layout to german
localectl set-keymap de
localectl set-x11-keymap de

# Set system time to germany
timedatectl set-timezone Europe/Berlin


# Disable automatic screen lock
su -c "dbus-launch gsettings set org.gnome.desktop.screensaver lock-enabled false" vagrant

# Disable auto screen turn off
su -c "dbus-launch gsettings set org.gnome.desktop.session idle-delay 0" vagrant
