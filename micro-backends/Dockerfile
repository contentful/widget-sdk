FROM node:8-alpine

ARG NPM_TOKEN
RUN echo '//registry.npmjs.org/:_authToken=${NPM_TOKEN}' >> ~/.npmrc

WORKDIR /app

RUN echo '{"dependencies": {"@contentful/micro-backends": "^0.2.0"}}' > package.json

RUN npm install
