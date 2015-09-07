'use strict';

var libs = {
  CodeMirror: require('codemirror'),
  MarkedAst:  require('marked-ast'),
  React:      require('react')
};

require('codemirror/addon/mode/overlay');
require('codemirror/mode/xml/xml');
require('codemirror/mode/markdown/markdown');
require('codemirror/mode/gfm/gfm');
require('codemirror/addon/edit/continuelist');

if (window.cfFeedLazyLoader) {
  window.cfFeedLazyLoader('markdown', libs);
} else {
  window.cfLibs = window.cfLibs || {};
  window.cfLibs.markdown = libs;
}
