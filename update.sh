#!/bin/bash

set -ev

bundle install --no-color
pushd ./app/assets/commonjs_modules/user_interface

rm -rf tmp/cache/*
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
