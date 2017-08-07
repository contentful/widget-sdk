'use strict';

require('angular-ui-sortable');

angular.module('cf.libs', [])
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
  .constant('libs/flat', require('flat'))
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

// TODO dotty should be replaced with _.get / _.set
window.dotty = {
  get: function (obj, path, defaultValue) {
    if (Array.isArray(path) && path.length === 0) {
      return obj;
    } else {
      path = Array.isArray(path) ? path.slice() : path;
      return window._.get(obj, path, defaultValue);
    }
  },
  put: function (obj, path, value) {
    path = Array.isArray(path) ? path.slice() : path;
    return window._.set(obj, path, value);
  }
};
