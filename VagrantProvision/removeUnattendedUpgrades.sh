#!/bin/bash

# Halt and remove unattended-upgrades
# This is necessary because that service blocks "apt-get" usage

systemctl stop apt-daily.timer
systemctl stop apt-daily-upgrade.timer

/usr/share/unattended-upgrades/unattended-upgrade-shutdown

rm /var/lib/apt/lists/lock
rm /var/cache/apt/archives/lock
rm /var/lib/dpkg/lock

apt-get -y purge update-manager unattended-upgrades
