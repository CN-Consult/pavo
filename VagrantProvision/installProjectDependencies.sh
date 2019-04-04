#!/bin/bash

# Installs the projects dependencies

echo "Installing project dependencies"

echo "Executing \"npm install\" ..."
cd /home/vagrant/project
npm install --unsafe-perm=true
