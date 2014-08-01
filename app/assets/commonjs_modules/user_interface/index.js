'use strict';

var UserInterface = {
  worf: require('worf'),
  validation: require('contentful-validation'),
  mimetype: require('contentful-mimetype'),
  contentfulClient: require('contentful-client'),
  stringifySafe: require('json-stringify-safe'),
  isDiacriticalMark: require('is-diacritical-mark'),
  searchParser: require('./search'),
  fileSize: require('file-size')
};

module.exports = UserInterface;

if(window){
  window._ = require('lodash-node/modern');
  window.dotty = require('dotty');
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
    constant('searchParser', UserInterface.searchParser).
    constant('fileSize', UserInterface.fileSize).
    constant('isDiacriticalMark', UserInterface.isDiacriticalMark);
  angular.module('contentful/user_interface').factory('marked', function () {
    var marked = require('marked');
    marked.setOptions({
      tables: false,
      sanitize: true
    });
    return marked;
  });
}

