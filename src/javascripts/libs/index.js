'use strict';

require('babel-polyfill');
require('angular-ui-sortable');

// CodeMirror: JSON field editor component
require('codemirror/addon/edit/closebrackets');
require('codemirror/mode/javascript/javascript');
// CodeMirror: Markdown field editor component
require('codemirror/mode/markdown/markdown');
// CodeMirror: HTML highlighting inside Markdown
require('codemirror/mode/xml/xml');
require('codemirror/addon/edit/continuelist');
require('codemirror/addon/mode/overlay');

angular.module('cf.libs', [])
  .constant('libs/react-tippy', require('react-tippy'))
  .constant('libs/color', require('color'))
  .constant('libs/sanitize-html', require('sanitize-html'))
  .constant('libs/react', require('react'))
  .constant('libs/prop-types', require('prop-types'))
  .constant('libs/react-dom', require('react-dom'))
  .constant('libs/react-dom/test-utils', require('react-dom/test-utils'))
  .constant('libs/react-click-outside', require('react-click-outside'))
  .constant('libs/react-highlight-words', require('react-highlight-words'))
  .constant('libs/enzyme', require('enzyme'))
  .constant('libs/enzyme-adapter-react-16', require('enzyme-adapter-react-16'))
  .constant('libs/downshift', require('downshift'))
  .constant('create-react-class', require('create-react-class'))
  .constant('libs/codemirror', require('codemirror'))
  .constant('libs/qs', require('qs'))
  .constant('libs/marked', require('marked-ast')._marked)
  .constant('libs/MarkedAst', require('marked-ast'))
  .constant('libs/launch-darkly-client', require('ldclient-js'))
  .constant('libs/element-resize-detector', require('element-resize-detector'))
  .constant('libs/sum-types', require('sum-types'))
  .constant('libs/sum-types/caseof-eq', require('sum-types/caseof-eq'))
  .constant('libs/editors', require('../../../vendor/extensions/core-field-editors'))
  .constant('libs/kefir', require('kefir'))
  .constant('libs/@contentful/client', require('../../../packages/client'))
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
  .constant('speakingurl', require('speakingurl'))
  .constant('Cookies', require('js-cookie'))
  .constant('worf', require('@contentful/worf'))
  .constant('Pikaday', require('pikaday'))
  .constant('validation', require('@contentful/validation'))
  .constant('widgetMap', require('@contentful/widget-map'))
  .constant('scroll-into-view', require('scroll-into-view'))
  .constant('libs/Sortable', require('sortablejs'));

// This needs to be called after everything else so we override any
// previously imported versions of lodash
window._ = require('lodash');
