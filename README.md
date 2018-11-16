Pavo
====

Description
-----------

Pavo is an electron app that displays and toggles between multiple web pages.


Usage
-----

* Create a config.json file in /home/<user>/config
* Build the executable file
* Execute the binary file


Set up a development environment
--------------------------------

* vagrant up
* vagrant ssh
* GUI: Login as vagrant (password: vagrant)
* cd project
* sudo npm install --unsafe-perm=true
* npm start
* sudo npm run dist


Kill Process
------------

### Executable File ###

* ps ax | grep pavo
* Find "/tmp/.mount_pavo-<random>/pavo" and remember the process id at the start of that line
* kill <process id>

### Development environment ###

* ps ax | grep electron
* Find "node /home/vagrant/project/node_modules/.bin/electron . --disable-renderer-backgrounding"
* kill <process id>
