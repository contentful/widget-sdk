#
# Base image for the contentful/user_interface image
#
# - Installs firefox, xvfb, unzip, and fpm as packages
# - Installs SlimerJS into /app/vendor
#
FROM node:4.4

RUN apt-get update && \
  apt-get install -qqy firefox-esr unzip xvfb ruby-dev ruby gcc make && \
  gem install --no-document 'json:<2.0' fpm

RUN \
  mkdir -p /app/vendor && cd /app/vendor && \
  curl -O --progress-bar "http://download.slimerjs.org/releases/0.10.0/slimerjs-0.10.0.zip" && \
  unzip -qq "slimerjs-0.10.0.zip" -d slimerjs && \
  mkdir firefox && ln -s /usr/bin/firefox firefox/firefox

# We need a custom xvfb-run because the debian one does not work properly
COPY xvfb-run /usr/bin/
