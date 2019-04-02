#!/bin/bash

# Read the content of the .gitignore file
# Also remove specific allowed entries from the array


# @see https://stackoverflow.com/a/11393884
#
# Read the contents of .gitignore into an array
IFS=$'\r\n' command eval 'gitIgnoreFilePaths=($(cat /vagrant/.gitignore))'

# Remove allowed git ignore paths from the list of git ignore file paths
allowedGitIgnorePaths=()
for allowedGitIgnorePathId in "${!allowedGitIgnorePaths[@]}"
do

    for gitIgnoreFilePathId in "${!gitIgnoreFilePaths[@]}"; do
      if [ "${allowedGitIgnorePaths[$allowedGitIgnorePathId]}" = "${gitIgnoreFilePaths[$gitIgnoreFilePathId]}" ]; then
        unset "gitIgnoreFilePaths[$gitIgnoreFilePathId]"
      fi
    done

done

# Build the list of additional ignored files
additionalIgnoreFilePaths=("Vagrantfile" "VagrantProvision" ".git" ".gitignore")

# Build the list of ignored files
ignoreFilePaths=("${gitIgnoreFilePaths[@]}" "${additionalIgnoreFilePaths[@]}")


# Create the symlinks
mkdir /home/vagrant/project

for filePath in /vagrant/*
do

  fileName="$(basename $filePath)"

  # Check if file is ignored
  fileIsIgnoredFile=0
  for ignoreFilePath in "${ignoreFilePaths[@]}"; do
    if [ "$fileName" = "$ignoreFilePath" ]; then
      fileIsIgnoredFile=1
      break
    fi
  done

  if [ $fileIsIgnoredFile -eq 0 ]; then
    ln -rs "/vagrant/$fileName" "/home/vagrant/project/$fileName"
  fi

done


ln -fs "/vagrant/config" "/home/vagrant/config"
