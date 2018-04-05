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
  ['libs/qs', require('qs')],
  ['libs/react-tippy', require('react-tippy')],
  ['libs/color', require('color')],
  ['libs/sanitize-html', require('sanitize-html')],
  ['libs/react', require('react')],
  ['libs/prop-types', require('prop-types')],
  ['libs/react-dom', require('react-dom')],
  ['libs/react-dom/test-utils', require('react-dom/test-utils')],
  ['libs/react-click-outside', require('react-click-outside')],
  ['libs/react-highlight-words', require('react-highlight-words')],
  ['libs/react-animate-height', require('react-animate-height')],
  ['libs/enzyme', require('enzyme')],
  ['libs/enzyme-adapter-react-16', require('enzyme-adapter-react-16')],
  ['libs/downshift', require('downshift')],
  ['create-react-class', require('create-react-class')],
  ['classnames', require('classnames')],
  ['libs/codemirror', require('codemirror')],
  ['libs/marked', require('marked-ast')._marked],
  ['libs/MarkedAst', require('marked-ast')],
  ['libs/launch-darkly-client', require('ldclient-js')],
  ['libs/element-resize-detector', require('element-resize-detector')],
  ['libs/sum-types', require('sum-types')],
  ['libs/sum-types/caseof-eq', require('sum-types/caseof-eq')],
  ['libs/editors', require('../../../vendor/extensions/core-field-editors')],
  ['libs/kefir', require('kefir')],
  ['libs/legacy-client', require('../../../packages/client')],
  ['libs/sharejs', window.sharejs],
  ['libs/flat', require('flat')],
  ['libs/rtl-detect', require('rtl-detect')],
  ['hostnameTransformer', require('@contentful/hostname-transformer')],
  ['mimetype', require('@contentful/mimetype')],
  ['raw/moment', require('moment')],
  ['raw/htmlEncoder', require('node-html-encoder')],
  ['stringifySafe', require('json-stringify-safe')],
  ['searchParser', require('./search.pegjs')],
  ['localesList', require('./locales_list.json')],
  ['fileSize', require('file-size')],
  ['speakingurl', require('speakingurl')],
  ['Cookies', require('js-cookie')],
  ['worf', require('@contentful/worf')],
  ['Pikaday', require('pikaday')],
  ['validation', require('@contentful/validation')],
  ['widgetMap', require('@contentful/widget-map')],
  ['scroll-into-view', require('scroll-into-view')],
  ['libs/Sortable', require('sortablejs')]
];
