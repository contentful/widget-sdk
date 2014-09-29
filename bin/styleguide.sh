#!/bin/sh
# This script generates the styleguide with the following steps
# - Generates the app CSS into a single file
# - Generates custom styleguide template CSS
# - Generates the actual styleguide with KSS node
#
# Additionally, it will get the gh-pages branch where the styleguide is published
# and if the "push" argument is supplied, it will push updates remotely

set -e

pushd app/assets/stylesheets

# get the gh-pages branch of the repo
if [ ! -d styleguide ] ; then
  git clone --single-branch --branch gh-pages git@github.com:contentful/user_interface.git styleguide
fi

# CSS and Styleguide generation
stylus --use ../../../node_modules/nib/ < main.styl > compiled.css
stylus --use ../../../node_modules/nib/ < styleguide_template/public/custom.styl > styleguide_template/public/custom.css 
kss-node --css compiled.css --template styleguide_template .
rm -f compiled.css

# push updates remotely
if [ "$1" == "push" ] ; then
  cd styleguide
  git add .
  git commit -a
  git push origin gh-pages
fi

popd
