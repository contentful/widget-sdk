#!/bin/sh

set -ev

bundle install --no-color
cd ./app/assets/commonjs_modules/user_interface
npm link worf
npm link spock
npm link contentful-client
npm link validation
npm link share
