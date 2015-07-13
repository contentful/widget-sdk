#!/bin/bash
# This script pushes the styleguide into the gh-pages branch
set -e
echo "Publishing styleguide"

PAGES_DIR=./gh-pages
REPO="git@github.com:contentful/user_interface.git"

gulp clean
gulp styleguide

# get the gh-pages branch of the repo
if [ ! -d $PAGES_DIR ] ; then
  git clone --single-branch --branch gh-pages $REPO $PAGES_DIR
fi

cp -r public/styleguide/* $PAGES_DIR

pushd $PAGES_DIR
git add .
git commit -a
if [ $? -eq 1 ] ; then
  echo "Nothing to update"
else
  git push origin gh-pages
fi
popd
