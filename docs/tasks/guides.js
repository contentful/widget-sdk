'use strict';

import path from 'path';
import nj from 'nunjucks';
import marked from 'marked';
import frontmatter from 'front-matter';
import * as utils from './utils';
import cheerio from 'cheerio';
import _ from 'lodash-node';
import combine from 'stream-combiner';
import gutil from 'gulp-util';
import hljs from 'highlight.js';

/**
 * Pipeline that renders markdown files and generates an index file for
 * them.
 *
 * The index file is an angular module that provides the index as a
 * json object.
 */
export default function guides () {
  return combine(
    addFrontMatter(),
    markdownLex(),
    markdownRender(),
    htmlToc(),
    buildIndex(),
    renderTemplate()
  );
}


/**
 * Tokenize Markdown files and add tokens on the `markdown` property
 */
function markdownLex () {
  return utils.forEach(function (file) {
    if (path.extname(file.path) === '.md')
      file.markdown = marked.lexer(file.contents.toString());
  });
}


/**
 * Render the tokens on `file.markdown` to `file.contents` and replace
 * the the file extension with '.html'.
 */
function markdownRender () {
  var Renderer = marked.Renderer;
  var renderBase = Renderer.prototype;
  var renderer = new Renderer();

  renderer.link = function (href, title, text) {
    return renderBase.link.call(this, href, title, text);
  };

  renderer.code = function (code, lang) {
    var html = highlight(code, lang);
    return `<code class="md-code-block hljs"><pre>${html}</pre></code>`;
  };

  renderer.codespan = function (code) {
    return `<code class="md-code-inline">${code}</code>`;
  };

  return utils.forEach(function (file) {
    var tokens = file.markdown;
    if (!tokens)
      return;

    var src = file.contents.toString();
    var rendered = marked.parse(src, {renderer});
    file.path = gutil.replaceExtension(file.path, '.html');
    file.contents = new Buffer(rendered);
  });
}


/**
 * Stream transformer that renders files that have a `template` and
 * `data` property.
 */
function renderTemplate () {
  var templateDir = path.resolve(__dirname, '..', 'templates');
  var env = new nj.configure(templateDir, {watch: false});
  env.addFilter('json', function (data) {
    return JSON.stringify(data, null, 2);
  });
  return utils.forEach(function (file) {
    if (file.template && file.data) {
      file.contents = new Buffer(env.render(file.template, file.data));
    }
  });
}


/**
 * Returns a stream transformer that extracts the frontmatter form a
 * files content and attaches it to the file’s `attributes` property.
 */
function addFrontMatter () {
  return utils.forEach(function (file) {
    var contents = file.contents.toString();
    if (!file.attributes)
      file.attributes = {};

    if (frontmatter.test(contents)) {
      var data = frontmatter(contents);
      file.contents = new Buffer(data.body);
      _.extend(file.attributes, data.attributes);
    }
  });
}


function buildIndex () {
  var indexFile = utils.makeVirtualFile('js/page-index.js', {
      data: {pages: []},
      template: 'services/page-index.nj.js'
  });

  return utils.collect(function (indexFile, file) {
    if (file.attributes.index === false)
      return indexFile;

    var toc = file.toc[0];
    indexFile.data.pages.push({
      title: file.attributes.title || toc.title,
      path:  omitExtension(file.relative),
      toc:   toc.contents
    });
    return indexFile;
  }, indexFile);
}


/**
 * Generates a table of contents from an HTML file and attaches it to
 * `file.toc`.
 *
 * The table of contents is generated from the 'h1', 'h2', and 'h3'
 * tags.
 */
function htmlToc () {
  return utils.forEach(function (file) {
    if (path.extname(file.path) !== '.html')
      return;

    var $doc = cheerio.load(file.contents.toString());
    var toc = getToc($doc);
    file.toc = tocTree(toc).contents;
  });
}

function getToc ($doc) {
  return $doc('h1, h2, h3').map(function (i, el) {
    var $element = $doc(el);
    return {
      level: parseInt(el.name.substr(1)),
      title: $element.html(),
      id:    $element.attr('id') || null
    };
  }).get();
}


function makeTocNode (toc) {
  return _.extend({contents: []}, toc);
}

function tocTree (toc, parent) {
  if (!parent)
    parent = makeTocNode({level: 0});
  while(toc.length > 0) {
    var entry = toc[0];
    var node = makeTocNode(entry);
    var {level} = entry;
    if (level > parent.level) {
      parent.contents.push(node);
      toc.shift();
      tocTree(toc, node);
    } else {
      return parent;
    }
  }
  return parent;
}


function omitExtension (path) {
  return path.replace(/\.[a-zA-Z]+$/, '');
}

function highlight(code, lang) {
  if (!lang)
    return hljs.highlightAuto(code).value;
  else
    return hljs.highlight(lang, code).value;
}

