'use strict';

require('angular-ui-sortable');

window.dotty = require('./dottie_wrapper.js');
angular.module('cf.libs', [])
  .constant('libs/dotty', window.dotty)
  .constant('libs/preact', require('preact'))
  .constant('libs/qs', require('qs'))
  .constant('libs/marked', require('marked-ast')._marked)
  .constant('libs/MarkedAst', require('marked-ast'))
  .constant('libs/launch-darkly-client', require('ldclient-js'))
  .constant('libs/element-resize-detector', require('element-resize-detector'))
  .constant('libs/sum-types', require('sum-types'))
  .constant('libs/sum-types/caseof-eq', require('sum-types/caseof-eq'))
  .constant('libs/editors', require('../../../vendor/extensions/core-field-editors'))
  .constant('libs/Immutable', require('immutable'))
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
  .constant('widgetMap', require('@contentful/widget-map'))
  .constant('md5', require('blueimp-md5'));

// This needs to be called after everything else so we override any
// previously imported versions of lodash
window._ = require('lodash');
