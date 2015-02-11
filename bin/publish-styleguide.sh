#!/bin/bash
# This script pushes the styleguide into the gh-pages branch
set -e

# get the gh-pages branch of the repo
if [ ! -d styleguide ] ; then
  git clone --single-branch --branch gh-pages git@github.com:contentful/user_interface.git styleguide
fi

cp -r public/styleguide/* styleguide/

pushd styleguide
git add .
git commit -a
git push origin gh-pages
popd

rm -rf styleguide
