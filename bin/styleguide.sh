#!/bin/sh

pushd app/assets/stylesheets
kss-node -y ../../../node_modules/nib/index.styl .
popd
