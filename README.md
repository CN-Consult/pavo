Pavo
====

Description
-----------

Pavo is an electron app that displays and toggles between multiple web pages.


Usage
-----

* Create a config.json file in /home/\<user>/config
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

Note: You also have to run "npm install" on the host system because the web server tries to access the node_modules directory inside "/vagrant"


Kill Process
------------

### Executable File ###

* ps ax | grep pavo
* Find "/tmp/.mount_pavo-\<random>/pavo" and remember the process id at the start of that line
* kill \<process id>

### Development environment ###

* ps ax | grep electron
* Find "node /home/vagrant/project/node_modules/.bin/electron . --disable-renderer-backgrounding"
* kill \<process id>


Web Interface
-------------

The web interface can be used with \<host>:8080
