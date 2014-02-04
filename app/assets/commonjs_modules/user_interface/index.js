'use strict';

var UserInterface = {
  worf: require('worf'),
  validation: require('validation'),
  mimetype: require('contentful-mimetype'),
  contentfulClient: require('contentful-client'),
  stringifySafe: require('json-stringify-safe'),
  isDiacriticalMark: require('is-diacritical-mark')
};

module.exports = UserInterface;

if(window){
  window._ = require('lodash-node/modern');
  window.moment = require('moment');
  window.ZeroClipboard = require('zeroclipboard');
}

if (angular) {
  require('ng-time-relative');
  angular.module('contentful/user_interface', []).
    constant('contentfulClient', UserInterface.contentfulClient).
    constant('validation', UserInterface.validation).
    constant('mimetype', UserInterface.mimetype).
    constant('worf', UserInterface.worf).
    constant('stringifySafe', UserInterface.stringifySafe).
    constant('isDiacriticalMark', UserInterface.isDiacriticalMark);
}

