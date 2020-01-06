Build and Deployment with Docker
================================

We describe how the User Interface is built and deployed on Travis using Docker.

The following is an overview of the different steps defined in `.travis.yml`.

~~~bash
# Build the 'contentful/user-interface-ci' image from 'Dockerfile-test'.
bin/docker-build-ci

# Runs karma tests and eslint and validates configuration in a container
bin/docker-run-ci test

# Creates static files inside './output'
bin/docker-run-ci travis --branch "${TRAVIS_BRANCH}" --version "${TRAVIS_COMMIT}" --pr "${TRAVIS_PULL_REQUEST}"

# Upload `./output/files/${env}` to env specific S3 buckets
# Travis does that, no script needs to be run
~~~

The Docker Image
----------------

Testing and creating a deployable distribution happens in a docker container
based on the `contentful/user-interface-ci` image.

The image is built from `Dockerfile-ci` by running `bin/docker-build-ci`. It
installs all source code dependencies and builds the app using `gulp build`. The
image contains all fingerprinted assets in the `/app/build` directory. This
serves as a base to configure the `index.html` file and create the
distributions.

To build the image an NPM token is required as a build argument so that the
image can install prviate NPM packages. The `bin/docker-build-ci` command will
either use the `NPM_TOKEN` environment variable or extract the token from
`~/.npmrc`.

If you have dependencies that are fetched with Git and SSH you need to provide a
valid SSH key as the `SSH_KEY` environment variable to `bin/docker-build-ci`. On
Travis we always use the SSH key provided by Travis.

The entry point of the image (`tools/docker/entry-script`) exposes various
commands to test, serve, and distribute the application. Run `bin/docker-run-ci
--help` to see a list of commands.

The user interface image is based on the public
[`contentful/user-interface-base`][cf-ui-base-image]. This image contains system
dependencies like Chrome. The image is hosted on the Docker hub.

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

The app is deployed as a set of fingerprinted asset files (independent of the
environment they run in) and an `index.html` file which serves as the entry
point for the web application and is configured for a specific environment and
host. There are three target environments (“preview”, “staging”, and
“production”) with corresponding configurations in the `config` directory.

The `bin/docker-run travis` command creates distributions containing the
application files. It builds a file distribution for each environment in
`output/files/{env}`. These artefacts are uploaded to the respective S3
bucket by travis. From there, chef takes over and copies the `index.html`
from the S3 bucket for the environment in question. It is then served
by nginx and assets (js, css, etc) are fetched from S3.

The fingerprinted asset files only depend on the current revision of the
repository. They are included in the `user-interface` image together with
manifest to link asset names to their fingerprinted files.

Security and Compliance
-----------------------
Additionally to the CI tests, another important test is run. You can find more information under [Security and Compliance](../guides/security_and_compliance.md).