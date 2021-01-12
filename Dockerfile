FROM node:12.18.2-alpine as base

WORKDIR /app

ENV NPM_CONFIG_LOGLEVEL=warn CYPRESS_INSTALL_BINARY=0 NODE_ENV=development BLUEBIRD_DEBUG=0

RUN apk add --update --no-cache openssh build-base python bash git curl && rm -rf /var/cache/apk/*

COPY package.json package-lock.json ./

ARG NPM_TOKEN
RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" >> ~/.npmrc

ARG SSH_KEY
RUN mkdir -p ~/.ssh && chmod 0700 ~/.ssh && \
  ssh-keyscan github.com > ~/.ssh/known_hosts && \
  echo "$SSH_KEY" > ~/.ssh/id_rsa && \
  chmod 0600 ~/.ssh/id_rsa && \
  npm ci && \
  rm -f ~/.ssh/id_rsa

COPY ./ ./

#--

FROM base as built

RUN NODE_ENV=production node --max_old_space_size=4096 ./tools/bin/build-app.js

ARG CIRCLE_BRANCH
ARG CIRCLE_SHA1

RUN bin/docker-entry upload-sourcemaps-to-bugsnag --git-sha "${CIRCLE_SHA1}"

ENV SENTRY_ORG=contentful SENTRY_PROJECT=user-interface
ARG SENTRY_AUTH_TOKEN
RUN curl -sL https://sentry.io/get-cli/ | bash && \
    bin/create-sentry-release $CIRCLE_SHA1 $CIRCLE_BRANCH

# Remove any sourcemaps now that they are uploaded to Sentry/Bugsnag
RUN rm ./public/app/*.map

RUN bin/docker-entry configure-file-dist --branch-name "${CIRCLE_BRANCH}" --git-sha "${CIRCLE_SHA1}"
#--

FROM nginx:1.10-alpine as production

# TODO Make this configurable at runtime
ARG CF_ENV=development
ARG CF_VERSION

# File layout
# output/files/${env}/app
# output/files/${env}/archive/${version}/index-compiled.html
COPY --from=built /app/output/files /app

# Make a folder under /app/{env}/archive/ called "live" and
# put /app/{env}/archive/{hash of the commit that was built}/index-compiled.html there
# It is then served as defined in cf-infra-stacks/kubeconfig_templates/types/traffic-mgmt/user-interface/configmap.yaml
RUN ln -s /app/development/archive/${CF_VERSION} /app/development/archive/live
RUN ln -s /app/preview/archive/${CF_VERSION} /app/preview/archive/live
RUN ln -s /app/staging/archive/${CF_VERSION} /app/staging/archive/live
RUN ln -s /app/production/archive/${CF_VERSION} /app/production/archive/live

# Link environment to be served
RUN ln -sf /app/${CF_ENV}/archive/${CF_VERSION}/index-compiled.html /usr/share/nginx/html/index.html
RUN ln -sf /app/${CF_ENV}/app /usr/share/nginx/html/app

# Expose on the default user_interface port
RUN sed -i 's/80;/3001;/' /etc/nginx/conf.d/default.conf

EXPOSE 3001
