FROM contentful/user-interface-base:1

ARG NPM_TOKEN
WORKDIR /app

ENV PATH=/app/node_modules/.bin:$PATH \
    NPM_CONFIG_LOGLEVEL=warn


# Install dependencies
COPY package.json \
     npm-shrinkwrap.json \
     ./

RUN echo "//registry.npmjs.org/:_authToken=${NPM_TOKEN}" > ~/.npmrc && \
    npm install --no-optional

COPY vendor ./vendor
RUN cd vendor/ui-extensions-sdk && \
      npm install --no-optional --production --quiet && \
      make

# Copy source files and build app
COPY ./ ./
RUN gulp build/with-styleguide

ENTRYPOINT ["bin/docker-entry"]
