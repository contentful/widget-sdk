#!/usr/bin/env bash
#
# Uses estivador https://github.com/contentful/estivador to build and promote
# a package and an image used within the internal contentful infrastructure
#

set -e

pushd $TRAVIS_BUILD_DIR

# Download estivador and validate checksum
curl -fsSLO https://contentful-lab-assets.s3.amazonaws.com/estivador && chmod +x estivador
echo "$(curl -sSL https://contentful-lab-assets.s3.amazonaws.com/estivador.sum)" | sha512sum -c
# Put package & image
./estivador docker-ecr-login

# Upload infrastructure assets
# Packages are only produced for main environments
if [[ "$TRAVIS_BRANCH" =~ (preview|master|production) ]]; then
  ./estivador put-package --package $(ls output/package/archive/user_interface/pool/*.deb)
fi
./estivador put-image
./estivador notify-slack
# Promote infrastructure assets
if [[ "$TRAVIS_BRANCH" =~ (preview|master|production) ]]; then
  ./estivador promote-package
fi
./estivador promote-image
./estivador notify-slack --promotion

popd
