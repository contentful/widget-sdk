'use strict';

var UserInterface = {
  worf: require('worf'),
  validation: require('contentful-validation'),
  mimetype: require('contentful-mimetype'),
  contentfulClient: require('contentful-client'),
  hostnameTransformer: require('contentful-hostname-transformer'),
  stringifySafe: require('json-stringify-safe'),
  isDiacriticalMark: require('is-diacritical-mark'),
  searchParser: require('./search.pegjs'),
  localesList: require('./locales_list.json'),
  fileSize: require('file-size'),
  redefine: require('redefine'),
  resolveResponse: require('contentful-resolve-response'),
  querystring: require('querystring')
};

module.exports = UserInterface;

if(window){
  window._ = require('lodash-node/modern');
  window.dotty = require('dotty');
  window.moment = require('moment');
  window.ZeroClipboard = require('zeroclipboard');
}

if (angular) {
  angular.module('contentful/user_interface', []).
  constant('moment', window.moment).
  constant('privateContentfulClient', UserInterface.contentfulClient).
  constant('hostnameTransformer', UserInterface.hostnameTransformer).
  constant('validation', UserInterface.validation).
  constant('mimetype', UserInterface.mimetype).
  constant('worf', UserInterface.worf).
  constant('stringifySafe', UserInterface.stringifySafe).
  constant('isDiacriticalMark', UserInterface.isDiacriticalMark).
  constant('searchParser', UserInterface.searchParser).
  constant('localesList', UserInterface.localesList).
  constant('fileSize', UserInterface.fileSize).
  constant('redefine', UserInterface.redefine).
  constant('resolveResponse', UserInterface.resolveResponse).
  constant('querystring', UserInterface.querystring).

  // TODO moment should be a proper, configurable service
  run(['moment', function (moment) {
      moment.locale('en', {
        calendar: {
          lastDay : '[Yesterday], LT',
          sameDay : '[Today], LT',
          nextDay : '[Tomorrow], LT',
          lastWeek : 'ddd, LT',
          nextWeek : '[Next] ddd, LT',
          sameElse : 'll'
        }
      });
  }]);

  angular.module('contentful/user_interface').factory('marked', function () {
    var marked = require('marked');
    marked.setOptions({
      tables: false,
      sanitize: true
    });
    return marked;
  });
}

