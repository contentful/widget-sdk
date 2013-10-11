'use strict';

var UserInterface = {
  worf: require('worf'),
  validation: require('validation'),
  mimetype: require('contentful-mimetype'),
  client: require('contentful-client'),
  stringifySafe: require('json-stringify-safe')
};

module.exports = UserInterface;

if (angular) {
  angular.module('contentful/user_interface', []).
    constant('contentfulClient', UserInterface.client).
    constant('validation', UserInterface.validation).
    constant('mimetype', UserInterface.mimetype).
    constant('worf', UserInterface.worf).
    constant('stringifySafe', UserInterface.stringifySafe);
}

