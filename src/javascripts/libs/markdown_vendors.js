'use strict';

// For JSON field editor component
require('codemirror/addon/edit/closebrackets');
require('codemirror/mode/javascript/javascript');

// For Markdown field editor component
require('codemirror/mode/markdown/markdown');
// HTML highlighting inside markdown
require('codemirror/mode/xml/xml');
require('codemirror/addon/edit/continuelist');
require('codemirror/addon/mode/overlay');

if (window.cfFeedLazyLoader) {
  window.cfFeedLazyLoader('markdown', getMarkdownVendors());
} else {
  window.cfLibs = window.cfLibs || {};
  window.cfLibs.markdown = getMarkdownVendors();
}

function getMarkdownVendors () {
  return {
    CodeMirror: require('codemirror'),
    React: require('react'),
    ReactDOM: require('react-dom')
  };
}
