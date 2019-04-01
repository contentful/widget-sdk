FROM node:10.15.3-alpine

ARG NPM_TOKEN
ARG MICRO_BACKENDS_VERSION

RUN echo "//registry.npmjs.org/:_authToken=$NPM_TOKEN" > ~/.npmrc
RUN npm install --production --no-save "@contentful/micro-backends@$MICRO_BACKENDS_VERSION"
