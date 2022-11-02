#!/bin/bash

# Install nodejs
# curl -sL https://deb.nodesource.com/setup_8.x | bash -
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get update
apt-get install -y libfuse2 nodejs npm  #npm  = only needed, when we do not use node from deb.nodesource.com

# Set the language to german
apt-get install -y language-pack-de language-pack-gnome-de
update-locale LANG=de_DE.UTF-8

# Set the keyboard layout to german
localectl set-x11-keymap de

# Set system time to germany
timedatectl set-timezone Europe/Berlin
