#!/bin/bash

set -ev

rm -rf tmp/cache

bundle install --no-color --local
pushd ./app/assets/commonjs_modules/user_interface
npm install
popd
