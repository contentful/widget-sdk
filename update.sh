#!/bin/sh

set -ev

bundle install
pushd ./app/assets/commonjs_modules/user_interface
npm install
popd
