#!/bin/sh

set -ev

bundle install --no-color
pushd ./app/assets/commonjs_modules/user_interface
if [ "$1" == "force_install" ] ; then
  npm link worf
  npm link spock
  npm link contentful-client
  npm link validation
  npm link share
else
  npm install
fi
popd
