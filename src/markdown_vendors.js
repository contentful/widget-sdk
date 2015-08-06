'use strict';

var CodeMirror = require('codemirror');
var marked = require('marked');
require('codemirror/addon/mode/overlay');
require('codemirror/mode/markdown/markdown');
require('codemirror/mode/gfm/gfm');
require('codemirror/addon/edit/continuelist');

var libs = module.exports = {
  CodeMirror: CodeMirror,
  marked:     marked
};

if (window.cfFeedLazyLoader) {
  window.cfFeedLazyLoader('markdown', libs);
}

if (window.jasmine) {
  window.CodeMirror = CodeMirror;
  window.marked     = marked;
}
