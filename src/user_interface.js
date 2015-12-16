'use strict';

if (window){
  window._ = require('lodash-node/modern');
  window.dotty = require('./dottie_wrapper.js');
}

if (angular) {
  angular.module('contentful/user_interface', []).
    constant('raw/moment', require('moment')).
    constant('privateContentfulClient', require('contentful-client')).
    constant('hostnameTransformer', require('contentful-hostname-transformer')).
    constant('validation', require('contentful-validation')).
    constant('mimetype', require('contentful-mimetype')).
    constant('worf', require('@contentful/worf')).
    constant('stringifySafe', require('json-stringify-safe')).
    constant('searchParser', require('./search.pegjs')).
    constant('localesList', require('./locales_list.json')).
    constant('fileSize', require('file-size')).
    constant('querystring', require('querystring')).
    constant('speakingurl', require('speakingurl')).
    constant('Cookies', require('js-cookie'));
}
