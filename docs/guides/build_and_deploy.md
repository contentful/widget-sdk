Build and Deployment Pipeline
=============================

We describe how the User Interface is built and deployed on Travis.

The following is an overview of the different steps defined in `.travis.yml`.

~~~bash
gulp build/with-styleguide

# Run NSP to check for security vulnerabilities
bin/travis-audit

# Runs karma tests and eslint
bin/travis-test

# Prepares Debian package
bin/create-package-dist

# Prepares file distribution in './upload'
tools/bin/create-file-dist.js build upload

# Upload './archive' to 'pkg.contentful.org'
# Travis does that, no script needs to be run

# Publish the package
bin/trigger-packagebot

# Upload './upload' to 'cf-preview-static-cdnorigin'
# Travis does that, no script needs to be run

# Trigger a travis build if necessary
bin/travis-run-jenkins
~~~

Configured Build
----------------

The script `gulp build/with-styleguide` runs `gulp build` and creates all
application files in the `./build` directory.

The build task compiles and fingerprints all assets (Javascript, CSS, and
image files) and puts them into `./build/app`. The fingerprint mapping is
recorded in manifest files.

The stylesheets are processed after fingerprinting all other files in order to
correctly resolve to fingerprinted URLs. This is not necessary for the
application source since it resolves the references at runtime by inspecting
`window.CF_MANIFEST`.

Finally a `build/index.html` file is created for the target environment. The
target environment is selected based on the branch Travis is building. The index
file includes the environment configuration from the `./config` directory and
links to the fingerprinted assets.

The script also runs `gulp styleguide` and `gulp build/copy-styleguide` which
generates the styleguide and copies all of the assets it uses into the
`./build/styleguide` directory.

Deployment
----------

After running `gulp build` two distributions can be created and then deployed.

There are three main branches that are deployed to different environments when
built. The deployment for these branches is packaged based.

    production -> contentful.com
    master -> flinkly.com
    preview -> quirely.com

Builds for all other branches are also deployed to the `quirely.com` domain but
can only be used by specifying the commit hash. This deployment is file based.

### Package-based Deployments

**Note** We plan to remove this method of deployment.

This deployment is run when one of the three main branches `production`,
`master`, or `preview` is built. A debian package is created, uploaded, and
[Package Bot][] is notified about the new package.

The `bin/create-package-dist` script creates the package and a commit index at

    ./archive/user_interface/pool/cf-user-interface_$version_$arch.deb
    ./archive/user_interface/git/$commit-rev

The commit index is a file containing the path to the package, relative to
`./archive`. The package uses the following files

    ./build -> /opt/contentful/cf-user-interface/build
    ./bin/process_hosts -> /opt/contentful/cf-user-interface/bin/process_hosts

The contents of the `./archive` folder is uploaded to `pkg.contentful.org`.

Then, `bin/trigger-packagebot` will notifiy [Package Bot][] and publish the
package built for the current commit. Packagebot will determine the environment
the package should be deployed to by inspecting the commit hash.

[Package Bot]: https://github.com/contentful/package-bot

### File-based Deployments

This deployment method uploads the application files to an S3 bucket from which
they can be served immediately.

The `tools/bin/create-file-dist.js` script copies the following directories and
files.

    build/app -> upload/app
    build/index.html -> upload/archive/$TRAVIS_COMMIT/index-compiled.html
    build/index.html -> upload/archive/$TRAVIS_BRANCH/index-compiled.html
    build/styleguide -> upload/styleguide/$TRAVIS_BRANCH

The `./upload` directory is then uploaded to the asset bucket for the
`quirely.com` domain.

Note that `build/index.html` has been configured for a given environment and
has fingerprinted URLs pointing to assets.
