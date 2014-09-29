#!/bin/sh

set -e

pushd app/assets/stylesheets
stylus --use ../../../node_modules/nib/ < main.styl > compiled.css
stylus --use ../../../node_modules/nib/ < styleguide_template/public/custom.styl > styleguide_template/public/custom.css 
kss-node --css compiled.css --template styleguide_template .
rm -f compiled.css
popd
