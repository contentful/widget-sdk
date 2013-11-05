'use strict';

var UserInterface = {
  worf: require('worf'),
  validation: require('validation'),
  mimetype: require('contentful-mimetype'),
  client: require('contentful-client'),
  stringifySafe: require('json-stringify-safe'),
  isDiacriticalMark: require('is-diacritical-mark')
};

module.exports = UserInterface;

if (angular) {
  angular.module('contentful/user_interface', []).
    constant('contentfulClient', UserInterface.client).
    constant('validation', UserInterface.validation).
    constant('mimetype', UserInterface.mimetype).
    constant('worf', UserInterface.worf).
    constant('stringifySafe', UserInterface.stringifySafe).
    constant('isDiacriticalMark', UserInterface.isDiacriticalMark);
}

