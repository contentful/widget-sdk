'use strict';

var libs = {
  CodeMirror: require('codemirror'),
  MarkedAst:  require('marked-ast'),
  React:      require('react')
};

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
  window.cfFeedLazyLoader('markdown', libs);
} else {
  window.cfLibs = window.cfLibs || {};
  window.cfLibs.markdown = libs;
}
