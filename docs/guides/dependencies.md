Dependencies
============

This document explains how to manage dependencies.

We use NPM with the shrinkwrap file to manage our dependencies.

Production dependencies in NPM are all those packages used on Travis to build
and test. Dev dependencies on the other hand are used to run tests locally,
build the documentation, etc.


Adding a dependency
-------------------

To ensure your installation is in a pristine state run
~~~js
git checkout package.json npm-shrinkwrap.json
rm -rf node_modules
npm install
~~~

Now you can add your dependency
~~~js
nvm use v6
npm install --save{-dev} my-dep@^1.2.3
npm shrinkwrap
./bin/clean-shrinkwrap
~~~

Although the User Interface generally uses Node v4 and NPM 2.x we prefer Node v6
and NPM 3.x for package installation since it will yield a smaller dependency
tree.

Make sure that `git diff npm-shrinkwrap.json` yields an appropriate, small
result.


Updating dependencies
---------------------

Updating a dependency is the same as adding a dependency. The commit that updates
the dependencies should include links to the change logs of the updated
dependencies.

Outdated dependencies are updated regularly as part of the [frontend support
duty][fe-support]. You can check for outdated packages using `npm outdated`.

[fe-support]: https://contentful.atlassian.net/wiki/display/ENG/Support+Duty


Blocked Updates
---------------

This is a list of dependencies that can not be updated along with the reason.

(Nothing here yet)
