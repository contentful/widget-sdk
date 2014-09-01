#!/bin/sh

set -e

pushd app/assets/stylesheets
stylus --use ../../../node_modules/nib/ < main.styl > compiled.css
kss-node --css compiled.css .
rm -f compiled.css
popd
