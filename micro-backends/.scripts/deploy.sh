#!/usr/bin/env bash

cd "$(dirname "${BASH_SOURCE[0]}")"

echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > .npmrc
echo '{"dependencies": {"@contentful/micro-backends": "^0.2.0"}}' > package.json

npm install

AWS_REGION="$MICRO_BACKENDS_AWS_REGION" \
  AWS_ACCESS_KEY_ID="$MICRO_BACKENDS_AWS_ACCESS_KEY_ID" \
  AWS_SECRET_ACCESS_KEY="$MICRO_BACKENDS_AWS_SECRET_ACCESS_KEY" \
  node deploy.js "rev-$TRAVIS_COMMIT"
