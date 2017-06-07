#
# Base image for the contentful/user-interface-test image
#
# - Installs firefox, xvfb, unzip, and fpm as packages
# - Installs SlimerJS into /app/vendor
#
FROM node:4.6

RUN apt-get update && \
  apt-get install -qqy firefox-esr unzip xvfb ruby-dev ruby gcc make && \
  gem install --no-document 'json:<2.0' fpm

RUN \
  mkdir -p /app/vendor && cd /app/vendor && \
  curl -O --progress-bar "https://download.slimerjs.org/releases/0.10.3/slimerjs-0.10.3.zip" && \
  unzip -qq "slimerjs-0.10.3.zip" -d slimerjs

# We need a custom xvfb-run because the debian one does not work properly
COPY xvfb-run /usr/bin/
