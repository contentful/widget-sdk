'use strict';

var libs = {
  CodeMirror: require('codemirror'),
  marked: require('marked')
};

require('codemirror/addon/mode/overlay');
require('codemirror/mode/markdown/markdown');
require('codemirror/mode/gfm/gfm');
require('codemirror/addon/edit/continuelist');

if (window.cfFeedLazyLoader) {
  window.cfFeedLazyLoader('markdown', libs);
} else {
  window.cfLibs = window.cfLibs || {};
  window.cfLibs.markdown = libs;
}
