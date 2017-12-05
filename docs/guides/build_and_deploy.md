Build and Deployment with Docker
================================

We describe how the User Interface is built and deployed on Travis using Docker.

The following is an overview of the different steps defined in `.travis.yml`.

~~~bash
# Build the 'contentful/user-interface-ci' image from 'Dockerfile-test'.
bin/docker-build-ci

# Runs karma tests and eslint and validates configuration in a container
bin/docker-run-ci test

# Creates Debian package and static files inside './output'
bin/docker-run-ci travis --branch "${TRAVIS_BRANCH}" --version "${TRAVIS_COMMIT}" --pr "${TRAVIS_PULL_REQUEST}"

# Upload './output/archive' to 'pkg.contentful.org'
# Travis does that, no script needs to be run

# Publish the package
bin/trigger-packagebot

# Upload './output/files' to 'cf-preview-static-cdnorigin'
# Travis does that, no script needs to be run

# Trigger a Jenkins build if necessary
bin/travis-run-jenkins
~~~


The Docker Image
----------------

Testing and creating a deployable distribution happens in a docker container
based on the `contentful/user-interface-ci` image.

The image is built from `Dockerfile-ci` by running `bin/docker-build-ci`. It
installs all source code dependencies (NPM and git submodules) and builds the
app using `gulp build`. The image contains all fingerprinted assets in the
`/app/build` directory. This serves as a base to configure the `index.html` file
and create the distributions.

To build the image an NPM token is required as a build argument so that the
image can install prviate NPM packages. The `bin/docker-build-ci` command will
either use the `NPM_TOKEN` environment variable or extract the token from
`~/.npmrc`.

The entry point of the image (`tools/docker/entry-script`) exposes various
commands to test, serve, and distribute the application. Run `bin/docker-run-ci
--help` to see a list of commands.

The user interface image is based on the public
[`contentful/user-interface-base`][cf-ui-base-image]. This image contains system
dependencies like Chrome and the fpm gem that are required to build and test
the code. The image is hosted on the Docker hub.

[cf-ui-base-image]: https://hub.docker.com/r/contentful/user-interface-base

### Updating the base image
If changes to the system dependencies are required the base image
`contentful/user-interface-base` needs to be updated. For this you need to be
part of the Contentful organization on Docker hub and write access to the
repository.

To test changes to the base image, make changes to
`tools/docker/base/Dockerfile`, build the image, and then push the image

~~~
docker build tools/docker/base/Dockerfile --tag contentful/user-interface-base:dev
docker push contentful/user-interface-base:dev
~~~

After that adjust `Dockerfil-ci` to use the `contentful/user-interface-base:dev`
image commit your changes and run them on Travis.

If the CI build is successful you must tag the base image with the next version
`V` and push it again.

~~~
docker tag contentful/user-interface-base:dev contentful/user-interface-base:V
docker push contentful/user-interface-base:V
~~~

Then change `Dockerfil-ci` to use the correct version and commit your changes.


Deployment
----------

The app is deployed as a set of fingerprinted asset files (indepedent of the
environment they run in) and an `index.html` file which serves as the entry
point for the web application and is configured for a specific environment and
host. There are three target environments (“preview”, “staging”, and
“production”) with corresponding configurations in the `config` directory.

The `bin/docker-run travis` command creates distributions containing the
application files. It builds a file distribution for each environment in
`output/files/{env}` and creates a Debian package when we deploy an environment
branch.

The fingerprinted asset files only depend on the current revision of the
repository. They are included in the `user-interface` image together with
manifest to link asset names to their fingerprinted files.
