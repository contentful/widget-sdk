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

// This needs to be called after everything else so we override any
// previously imported versions of lodash
window._ = require('lodash');

// This is on window so that `src/javascripts/prelude.js` can
// pick it up and properly register the libraries during initial
// invocation.
window.libs = [
  // Stubbable globals, like `window`, go here.
  // This is so that tests can stub out `window` based functions like
  // addEventListener and localStorage.
  ['global/window', window],

  ['jquery', window.$],
  ['lodash', window._],
  ['@contentful/ui-component-library', require('@contentful/ui-component-library')],
  ['qs', require('qs')],
  ['react-tippy', require('react-tippy')],
  ['color', require('color')],
  ['sanitize-html', require('sanitize-html')],
  ['react', require('react')],
  ['prop-types', require('prop-types')],
  ['react-dom', require('react-dom')],
  ['react-dom/test-utils', require('react-dom/test-utils')],
  ['react-click-outside', require('react-click-outside')],
  ['classnames', require('classnames')],
  ['react-highlight-words', require('react-highlight-words')],
  ['react-animate-height', require('react-animate-height')],
  ['enzyme', require('enzyme')],
  ['enzyme-adapter-react-16', require('enzyme-adapter-react-16')],
  ['downshift', require('downshift')],
  ['create-react-class', require('create-react-class')],
  ['classnames', require('classnames')],
  ['codemirror', require('codemirror')],
  ['marked', require('marked-ast')._marked],
  ['MarkedAst', require('marked-ast')],
  ['launch-darkly-client', require('ldclient-js')],
  ['element-resize-detector', require('element-resize-detector')],
  ['sum-types', require('sum-types')],
  ['sum-types/caseof-eq', require('sum-types/caseof-eq')],
  ['editors', require('@contentful/field-editors')],
  ['kefir', require('kefir')],
  ['legacy-client', require('../../../packages/client')],
  ['sharejs', window.sharejs],
  ['flat', require('flat')],
  ['rtl-detect', require('rtl-detect')],
  ['hostnameTransformer', require('@contentful/hostname-transformer')],
  ['mimetype', require('@contentful/mimetype')],
  ['raw/moment', require('moment')],
  ['raw/htmlEncoder', require('node-html-encoder')],
  ['stringifySafe', require('json-stringify-safe')],
  ['searchParser', require('./search.pegjs')],
  ['localesList', require('./locales_list.json')],
  ['fileSize', require('file-size')],
  ['pluralize', require('pluralize')],
  ['speakingurl', require('speakingurl')],
  ['Cookies', require('js-cookie')],
  ['worf', require('@contentful/worf')],
  ['Pikaday', require('pikaday')],
  ['validation', require('@contentful/validation')],
  ['widgetMap', require('@contentful/widget-map')],
  ['scroll-into-view', require('scroll-into-view')],
  ['Sortable', require('sortablejs')]
];
