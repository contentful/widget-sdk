#!/bin/bash

set -ev

rm -rf tmp/cache

bundle install --no-color --local
pushd ./app/assets/commonjs_modules/user_interface

if [ "$CI" = "true" ]; then
  npm install
else
  npm link worf
  npm link spock
  npm link contentful-client
  npm link contentful-mimetype
  npm link validation
  npm link share
fi

popd
