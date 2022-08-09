#!/bin/bash

# Set the keyboard layout to german
localectl set-keymap de

# Disable automatic screen lock
su -c "dbus-launch gsettings set org.gnome.desktop.screensaver lock-enabled false" vagrant

# Disable auto screen turn off
su -c "dbus-launch gsettings set org.gnome.desktop.session idle-delay 0" vagrant

# Enable auto login
sed -i "s/# *AutomaticLoginEnable.*/AutomaticLoginEnable = true/g" /etc/gdm3/custom.conf
sed -i "s/# *AutomaticLogin.*/AutomaticLogin = vagrant/g" /etc/gdm3/custom.conf
