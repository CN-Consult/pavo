#!/bin/bash

# Enable auto login
cat <<EOT > /etc/lightdm/lightdm.conf

[SeatDefaults]
autologin-user = vagrant
autologin-user-timeout = 0

EOT
