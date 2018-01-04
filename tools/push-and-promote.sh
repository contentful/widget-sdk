#!/usr/bin/env bash
#
# Uses estivador https://github.com/contentful/estivador to build and promote
# a package and an image used within the internal contentful infrastructure
#

set -e

# Skip this whole script if this is a PR build
if [ "$TRAVIS_PULL_REQUEST" != "false" ]; then exit 0; fi

pushd $TRAVIS_BUILD_DIR

# Download estivador and validate checksum
curl -fsSLO https://contentful-lab-assets.s3.amazonaws.com/estivador && chmod +x estivador
echo "$(curl -sSL https://contentful-lab-assets.s3.amazonaws.com/estivador.sum)" | sha512sum -c
# Put package & image
./estivador docker-ecr-login

# Upload built docker image
./estivador put-image

# Promote built docker image
./estivador promote-image

popd
