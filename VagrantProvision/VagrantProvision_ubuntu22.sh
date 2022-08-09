#!/bin/bash

# Enable auto login
sed -i "s/# *AutomaticLoginEnable.*/AutomaticLoginEnable = true/g" /etc/gdm3/custom.conf
sed -i "s/# *AutomaticLogin.*/AutomaticLogin = vagrant/g" /etc/gdm3/custom.conf
