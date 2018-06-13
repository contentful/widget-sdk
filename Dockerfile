# Builds an image for running a development version of the web app in
# the contentful lab [1].
#
# We just install the node dependencies. The source code is mounted as
# a volume. The default command runs the development server.
#
# Build arguments:
# * NPM_TOKEN used to fetch private NPM package from the @contentful
#   scope. Required.
# * SSH_KEY plain SSH key to fetch NPM dependencies from Github.
#   Optional.
#
# [1]: https://github.com/contentful/lab/
#

FROM ubuntu:14.04

RUN apt-get update && apt-get install -y curl xz-utils ssh git build-essential

COPY .node-version /app/

WORKDIR /app

# Ensure this is the same as the version in .node-version.json. That version will be
# running in production and we want to run it in tests.
RUN node_version=$(cat .node-version) && \
    mkdir -p /opt/node && \
    curl https://nodejs.org/dist/$node_version/node-$node_version-linux-x64.tar.xz | \
    tar -xJ --strip 1 -C /opt/node

ENV PATH=/opt/node/bin:$PATH

ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
  mkdir ~/.ssh

# Install dependencies
COPY package.json package-lock.json ./
COPY packages/client/package.json ./packages/client/

ARG SSH_KEY
RUN \
  ssh-keyscan github.com > ~/.ssh/known_hosts && \
  echo "$SSH_KEY" > ~/.ssh/id_rsa && \
  chmod 0600 ~/.ssh/id_rsa && \
  npm install --no-optional --unsafe-perm && \
  rm -f ~/.ssh/id_rsa

CMD ["./node_modules/.bin/gulp", "all", "serve"]
