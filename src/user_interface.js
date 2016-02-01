'use strict';

(function () {

  var lodash = null;

  if (window) {
    lodash = require('lodash-node/modern');
    window._ = lodash;
    window.dotty = require('./dottie_wrapper.js');
  }

  if (angular) {
    var module = angular.module('contentful/user_interface', []);

    // Libraries that may use already required lodash-node
    module.
      constant('privateContentfulClient', require('@contentful/client')).
      constant('hostnameTransformer', require('@contentful/hostname-transformer')).
      constant('mimetype', require('@contentful/mimetype')).
      constant('raw/moment', require('moment')).
      constant('stringifySafe', require('json-stringify-safe')).
      constant('searchParser', require('./search.pegjs')).
      constant('localesList', require('./locales_list.json')).
      constant('fileSize', require('file-size')).
      constant('querystring', require('querystring')).
      constant('speakingurl', require('speakingurl')).
      constant('Cookies', require('js-cookie'));


    // Libraries that do `require('lodash')` and leak it to the global object
    module.constant('worf', require('@contentful/worf'));
    fixLeak();
    module.constant('validation', require('@contentful/validation'));
    fixLeak();
  }

  function fixLeak() {
    if (window && lodash) {
      window._ = lodash;
    }
  }

}());
