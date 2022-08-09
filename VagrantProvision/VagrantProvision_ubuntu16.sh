#!/bin/bash

# Set the keyboard layout to german
localectl set-keymap de

# Disable automatic screen lock
su -c "dbus-launch gsettings set org.gnome.desktop.screensaver lock-enabled false" vagrant

# Disable auto screen turn off
su -c "dbus-launch gsettings set org.gnome.desktop.session idle-delay 0" vagrant

# Enable auto login
cat <<EOT > /etc/lightdm/lightdm.conf

[SeatDefaults]
autologin-user = vagrant
autologin-user-timeout = 0

EOT
