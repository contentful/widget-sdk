#
# Base image for the contentful/user-interface-test image
#
# - Installs unzip and fpm as packages
# - Installs Chrome to run tests with karma
#
FROM node:8.11

ADD https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb google-chrome.deb

RUN apt-get update && \
  apt-get install -qqy unzip ruby-dev ruby gcc make \
# Chrome dependencies
  gconf-service libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 \
  libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 \
  libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 \
  libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libappindicator3-1 libnss3 lsb-release xdg-utils && \
  dpkg -i google-chrome.deb && \
  gem install --no-document 'json:<2.0' fpm
