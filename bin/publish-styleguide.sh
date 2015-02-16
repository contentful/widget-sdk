#!/bin/bash
# This script pushes the styleguide into the gh-pages branch
echo "Publishing styleguide"

gulp clean
gulp stylesheets
gulp generate-styleguide

# get the gh-pages branch of the repo
if [ -d styleguide ] ; then
  rm -rf styleguide
fi
git clone --single-branch --branch gh-pages git@github.com:contentful/user_interface.git styleguide

cp -r public/styleguide/* styleguide/
cp -r public/app/main.css styleguide/public/
cp -r public/styleguide_custom/custom.css styleguide/public/

sed -i.bak -e 's/<link rel="stylesheet" href="\.\.\/styleguide_custom/<link rel="stylesheet" href="public/' styleguide/*.html
sed -i.bak -e 's/<link rel="stylesheet" href="\.\.\/app/<link rel="stylesheet" href="public/' styleguide/*.html
find styleguide/ -name *.bak -exec rm -f \{\} \;

pushd styleguide
git add .
git commit -a
if [ $? -eq 1 ] ; then
  echo "Nothing to update"
else
  git push origin gh-pages
fi
popd

rm -rf styleguide
