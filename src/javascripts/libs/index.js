'use strict';

require('angular-ui-sortable');

angular.module('cf.libs', [])
  .constant('libs/sum-types', require('sum-types'))
  .constant('libs/editors', require('../../../vendor/extensions/core-field-editors'))
  .constant('libs/kefir', require('kefir'))
  .constant('libs/@contentful/client', require('@contentful/client'))
  .constant('libs/sharejs', window.sharejs)
  .constant('hostnameTransformer', require('@contentful/hostname-transformer'))
  .constant('mimetype', require('@contentful/mimetype'))
  .constant('raw/moment', require('moment'))
  .constant('raw/htmlEncoder', require('node-html-encoder'))
  .constant('stringifySafe', require('json-stringify-safe'))
  .constant('searchParser', require('./search.pegjs'))
  .constant('localesList', require('./locales_list.json'))
  .constant('fileSize', require('file-size'))
  .constant('querystring', require('querystring'))
  .constant('speakingurl', require('speakingurl'))
  .constant('Cookies', require('js-cookie'))
  .constant('worf', require('@contentful/worf'))
  .constant('Pikaday', require('pikaday'))
  .constant('validation', require('@contentful/validation'))
  .constant('widgetMap', require('@contentful/widget-map'));
window.dotty = require('./dottie_wrapper.js');

// This needs to be called after everything else so we override any
// previously imported versions of lodash
window._ = require('lodash');
