'use strict';

if (window){
  window._ = require('lodash-node/modern');
  window.dotty = require('dotty');
  window.moment = require('moment');
  window.ZeroClipboard = require('zeroclipboard');
}

if (angular) {
  angular.module('contentful/user_interface', []).
  constant('moment', window.moment).
  constant('privateContentfulClient', require('contentful-client')).
  constant('hostnameTransformer', require('contentful-hostname-transformer')).
  constant('validation', require('contentful-validation')).
  constant('mimetype', require('contentful-mimetype')).
  constant('worf', require('worf')).
  constant('stringifySafe', require('json-stringify-safe')).
  constant('searchParser', require('./search.pegjs')).
  constant('localesList', require('./locales_list.json')).
  constant('fileSize', require('file-size')).
  constant('redefine', require('redefine')).
  constant('resolveResponse', require('contentful-resolve-response')).
  constant('querystring', require('querystring')).
  constant('Cookies', require('js-cookie')).

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

  // @todo it will be removed in #588
  angular.module('contentful/user_interface').factory('marked', function () {
    var marked = require('marked');
    marked.setOptions({
      tables: false,
      sanitize: true
    });
    return marked;
  });
}
