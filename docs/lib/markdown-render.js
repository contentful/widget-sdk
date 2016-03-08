'use strict';

import highlight from './highlight';
import marked, {Renderer} from 'marked';
import {defaults} from 'lodash-node'

export function render (content) {
  return marked(content, {renderer: createRenderer()});
}

export function compile (tokens, options) {
  return marked.parser(tokens, defaults(options, marked.defaults));
}

export function createRenderer () {
  let renderer = new Renderer();

  renderer.code = function (code, lang) {
    var html = highlight(code, lang);
    return `<code class="md-code-block hljs"><pre>${html}</pre></code>`;
  };

  renderer.codespan = function (code) {
    return `<code class="md-code-inline">${code}</code>`;
  };

  return renderer;
}
