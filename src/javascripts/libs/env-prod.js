'use strict';

/*
  This file is for the libraries loaded for the production application, e.g. no testing libraries
  like `enzyme`.

  See `libs/test.js` for those libraries.
 */

require('@babel/polyfill');
require('angular-ui-sortable');
// Polyfill for Element.closest used to support Slatejs in IE.
require('element-closest');

// CodeMirror: JSON field editor component
require('codemirror/addon/edit/closebrackets');
require('codemirror/mode/javascript/javascript');
// CodeMirror: Markdown field editor component
require('codemirror/mode/markdown/markdown');
// CodeMirror: HTML highlighting inside Markdown
require('codemirror/mode/xml/xml');
require('codemirror/addon/edit/continuelist');
require('codemirror/addon/mode/overlay');
// CodeMirror: mixed HTML mode for UI Extension editor
require('codemirror/mode/htmlmixed/htmlmixed');

// This is on window so that `src/javascripts/prelude.js` can
// pick it up and properly register the libraries during initial
// invocation.
window.libs = [
  // Stubbable globals, like `window`, go here.
  // This is so that tests can stub out `window` based functions like
  // addEventListener and localStorage.
  ['global/window', window],

  ['angular', window.angular],

  ['@contentful/forma-36-react-components', require('@contentful/forma-36-react-components')],
  ['@contentful/forma-36-tokens', require('@contentful/forma-36-tokens')],
  ['@contentful/contentful-slatejs-adapter', require('@contentful/contentful-slatejs-adapter')],
  [
    '@contentful/rich-text-plain-text-renderer',
    require('@contentful/rich-text-plain-text-renderer')
  ],
  ['@contentful/rich-text-types', require('@contentful/rich-text-types')],
  ['@contentful/rich-text-links', require('@contentful/rich-text-links')],
  ['@contentful/field-editors', require('@contentful/field-editors')],
  ['@contentful/hostname-transformer', require('@contentful/hostname-transformer')],
  ['@contentful/mimetype', require('@contentful/mimetype')],
  ['@contentful/sharejs/lib/client', require('@contentful/sharejs/lib/client')],
  ['@contentful/validation', require('@contentful/validation')],
  ['@contentful/widget-map', require('@contentful/widget-map')],
  ['@contentful/worf', require('@contentful/worf')],

  ['@jo-sm/asn1js', require('@jo-sm/asn1js')],

  ['classnames', require('classnames')],
  ['codemirror', require('codemirror')],
  ['color', require('color')],
  ['dataloader', require('dataloader')],
  ['js-cookie', require('js-cookie')],
  ['downshift', require('downshift')],
  ['element-resize-detector', require('element-resize-detector')],
  ['fast-deep-equal', require('fast-deep-equal')],
  ['file-size', require('file-size')],
  ['flat', require('flat')],
  ['immutable', require('immutable')],
  ['is-hotkey', require('is-hotkey')],
  ['json0-ot-diff', require('json0-ot-diff')],
  ['jquery', window.$],
  ['kefir', require('kefir')],
  ['ldclient-js', require('ldclient-js')],
  ['legacy-client', require('./legacy_client/client.js')],
  ['localesList', require('./locales_list.json')],
  ['saved-views-migrator', require('./saved-views-migrator')],
  ['lodash', require('lodash')],
  ['lodash/fp', require('lodash/fp')],
  ['marked', require('marked-ast')._marked],
  ['marked-ast', require('marked-ast')],
  ['path-parser', require('path-parser')],
  ['parse-github-url', require('parse-github-url')],
  ['pikaday', require('pikaday')],
  ['pluralize', require('pluralize')],
  ['prop-types', require('prop-types')],
  ['qs', require('qs')],
  ['node-html-encoder', require('node-html-encoder')],
  ['moment', require('moment')],
  ['react', require('react')],
  ['react-animate-height', require('react-animate-height')],
  ['react-click-outside', require('react-click-outside')],
  ['react-codemirror', require('react-codemirror')],
  ['react-dom', require('react-dom')],
  ['react-highlight-words', require('react-highlight-words')],
  ['react-redux', require('react-redux')],
  ['react-tippy', require('react-tippy')],
  ['redux', require('redux')],
  ['redux-thunk', require('redux-thunk')],
  ['reselect', require('reselect')],
  ['rtl-detect', require('rtl-detect')],
  ['sanitize-html', require('sanitize-html')],
  ['scroll-into-view', require('scroll-into-view')],
  ['slate', require('slate')],
  ['@productboard/slate-edit-list', require('@productboard/slate-edit-list')],
  ['slate-react', require('slate-react')],
  ['@wikifactory/slate-trailing-block', require('@wikifactory/slate-trailing-block')],
  ['slate-html-serializer', require('slate-html-serializer')],
  ['slate-plain-serializer', require('slate-plain-serializer')],
  ['sortablejs', require('sortablejs')],
  ['speakingurl', require('speakingurl')],
  ['json-stringify-safe', require('json-stringify-safe')],
  ['sum-types', require('sum-types')],
  ['sum-types/caseof-eq', require('sum-types/caseof-eq')],
  ['react-sticky-el', require('react-sticky-el')],
  ['detect-browser', require('detect-browser')],
  ['mitt', require('mitt')],
  ['react-player', require('react-player')],
  ['react-beautiful-dnd', require('react-beautiful-dnd')],
  ['@typeform/embed', require('@typeform/embed/dist/embed')],
  ['emotion', require('emotion')],
  ['immer', require('immer')],
  ['fclone', require('fclone')],
  ['react-joyride', require('react-joyride')]
];
