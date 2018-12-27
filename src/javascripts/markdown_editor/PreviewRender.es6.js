import { cloneDeep, extend, isString, isObject, isArray, isNull, includes } from 'lodash';
import { getDomains } from 'services/TokenStore.es6';
import sanitize from 'sanitize-html';
import * as React from 'react';
import MarkedAst from 'marked-ast';
import { getModule } from 'NgRegistry.es6';

const { htmlDecode } = getModule('encoder');

let currentId = 1;

const TERMINAL_TAGS = ['br', 'hr'];
const INLINE_TAGS = ['strong', 'em', 'del'];
const HTML_TAGS_RE = /<\/?[^>]+(>|$)/g;
const WHITESPACE_RE = /\s+/g;
const IMAGES_API_DEFAULT_H = 200;

// There's no value in trying to be permissive in the preview.
// We're sanitizing all "js:", "vbs:" and "data:" hrefs.
const FORBIDDEN_HREF_PREFIXES = ['javascript:', 'vbscript:', 'data:'];

// Configuration for raw HTML sanitization
//
// We copy and extend the base configuration of the 'sanitize-html' package.
//
// See the the packages readme for more info:
// https://github.com/punkave/sanitize-html
const SANITIZE_CONFIG = cloneDeep(sanitize.defaults);

SANITIZE_CONFIG.allowedTags.push('img');

SANITIZE_CONFIG.allowedAttributes['a'].push('rel', 'data-card-*');
SANITIZE_CONFIG.allowedAttributes['img'].push('alt', 'title');

SANITIZE_CONFIG.transformTags = {};
SANITIZE_CONFIG.transformTags['a'] = (tagName, attribs, text) => {
  if (attribs.target === '_blank') {
    attribs.rel = 'noopener noreferrer';
  }

  const classes = (attribs.class || '').split(' ');
  if (includes(classes, 'embedly-card')) {
    classes.push('markdown-block');
    attribs.class = classes.join(' ');
    attribs['data-card-controls'] = '0';
  }

  return { tagName, attribs, text };
};

SANITIZE_CONFIG.allowedClasses = {};
SANITIZE_CONFIG.allowedClasses['a'] = ['embedly-card', 'markdown-block'];

const NEWLINE_ENTITY_RE = new RegExp('&#10;', 'g');
SANITIZE_CONFIG.textFilter = text => text.replace(NEWLINE_ENTITY_RE, '\n');

/**
 * Returns a function that takes a Markdown string and produces preview
 * information. This information is an object with two properties:
 * - `root`: React element containing the root node of the preview
 * - `words`: an integer representing the number of words in the MD source
 */
export default function create() {
  const rootKey = 'root/' + currentId;
  let conflicts = {};
  let words = 0;

  currentId += 1;

  return function buildTree(source) {
    const ast = MarkedAst._marked(source, {
      // use renderer with altered methods for links and images
      renderer: new MarkedAst.AstBuilder(),
      // turn on Github-flavored MD goodies
      gfm: true,
      tables: true,
      breaks: true,
      smartypants: true,
      // we use $sanitize later on
      sanitize: false
    });

    const result = { root: createRootEl(ast), words };
    conflicts = {};
    words = 0;
    return result;
  };

  function buildLevel(level) {
    return (level || []).map(processItem).filter(notNull);
  }

  function processItem(item, i) {
    if (isString(item)) {
      return createFragmentEl(item);
    }
    if (!isObject(item)) {
      return null;
    }
    if (is(item, 'paragraph')) {
      return createParagraphEl(item, i);
    }
    if (is(item, 'inline')) {
      return createInlineEl(item, i);
    }
    if (is(item, 'heading')) {
      return createHeadingEl(item, i);
    }
    if (is(item, 'image')) {
      return createImageEl(item, i);
    }
    if (is(item, 'link')) {
      return createLinkEl(item, i);
    }
    if (is(item, 'list')) {
      return createListEl(item, i);
    }
    if (is(item, 'listitem')) {
      return createListItemEl(item, i);
    }
    if (is(item, 'terminal')) {
      return createTerminalEl(item, i);
    }
    if (is(item, 'blockquote')) {
      return createQuoteEl(item, i);
    }
    if (is(item, 'code')) {
      return createCodeBlockEl(item, i);
    }
    if (is(item, 'codespan')) {
      return createCodeSpanEl(item, i);
    }
    if (is(item, 'table')) {
      return createTableEl(item, i);
    }
    if (is(item, 'tablerow')) {
      return createTableRowEl(item, i);
    }
    if (is(item, 'tablecell')) {
      return createTableCellEl(item, i);
    }
    if (is(item, 'html')) {
      return createHtmlEl(item, i);
    }
    return null;
  }

  /**
   * Creating elements for AST parts
   */

  function createRootEl(ast) {
    return createReactEl('div', { key: rootKey }, buildLevel(ast));
  }

  function createFragmentEl(item) {
    return createLeafEl('span', item, { className: 'markdown-fragment' });
  }

  function createParagraphEl(item, key) {
    const props = { key, className: 'markdown-paragraph markdown-block' };
    return createParentEl('p', props, item.text);
  }

  function createInlineEl(item, key) {
    const props = { key, className: 'markdown-fragment' };
    return createParentEl(item.type, props, item.text);
  }

  function createHeadingEl(item, key) {
    const headingType = 'h' + item.level;
    const props = { key, className: 'markdown-heading markdown-block' };
    return createParentEl(headingType, props, item.text);
  }

  function createListEl(item, key) {
    const listType = item.ordered ? 'ol' : 'ul';
    const props = { key, className: 'markdown-list markdown-block' };
    return createParentEl(listType, props, item.body);
  }

  function createListItemEl(item, key) {
    return createParentEl('li', { key }, item.text);
  }

  function createImageEl(item, key) {
    const src = isString(item.href) ? prepareImageSrc(item.href) : null;
    const imgEl = createReactEl('img', { src, title: item.title, alt: item.text });
    const props = { key, className: 'markdown-image-placeholder markdown-block' };
    return createReactEl('div', props, imgEl);
  }

  function prepareImageSrc(src) {
    // AST contains an encoded URL.
    // React expects decoded one to handle on its own.
    src = htmlDecode(src);
    const domain = getDomains().images || 'images.contentful.com';

    return src.indexOf(domain) > -1 ? prepareImagesAPISrc(src) : src;
  }

  function prepareImagesAPISrc(src) {
    const qs = src.split('?')[1];

    if (isString(qs) && qs.length > 0) {
      return qs.indexOf('h=') > -1 ? src : `${src}&h=${IMAGES_API_DEFAULT_H}`;
    } else {
      return `${src}?h=${IMAGES_API_DEFAULT_H}`;
    }
  }

  function createLinkEl(item, key) {
    return createParentEl(
      'a',
      {
        key,
        href: getSafeHref(item),
        title: item.title,
        target: '_blank',
        rel: 'noopener noreferrer'
      },
      item.text
    );
  }

  function createTerminalEl(item, key) {
    return createReactEl(item.type, { key });
  }

  function createQuoteEl(item, key) {
    const props = { key, className: 'markdown-quote markdown-block' };
    return createParentEl('blockquote', props, item.quote);
  }

  function createCodeBlockEl(item, key) {
    const codeEl = createReactEl('code', null, item.code);
    const props = { key, className: 'markdown-code markdown-block' };
    return createReactEl('pre', props, codeEl);
  }

  function createCodeSpanEl(item, key) {
    const props = { key, className: 'markdown-fragment' };
    return createParentEl('code', props, item.text);
  }

  function createTableEl(item, key) {
    const headerEl = createReactEl('thead', { key: 'table/head/' + key }, buildLevel(item.header));
    const bodyEl = createReactEl('tbody', { key: 'table/body/' + key }, buildLevel(item.body));
    const props = { key, className: 'markdown-table markdown-block' };
    return createReactEl('table', props, [headerEl, bodyEl]);
  }

  function createTableCellEl(item, key) {
    const cellType = item.flags.header ? 'th' : 'td';
    return createParentEl(cellType, { key }, item.content);
  }

  function createTableRowEl(item, key) {
    return createParentEl('tr', { key }, item.content);
  }

  function createHtmlEl(item, key) {
    const props = { key, className: 'markdown-html markdown-block' };

    if (isString(item.html)) {
      return createLeafEl('div', item.html, props);
    } else if (isArray(item.html)) {
      return createLeafEl('div', item.html.reduce(accStrings, ''), props);
    } else {
      return null;
    }
  }

  /**
   * Low-level React DOM functions
   */

  function createLeafEl(tag, html, props) {
    const isClean = html.indexOf('<') < 0;

    if (!isClean) {
      html = sanitize(html, SANITIZE_CONFIG);
    }
    if (!html.length) {
      return null;
    }

    words += countWords(html, isClean);
    props = extend(props || {}, {
      dangerouslySetInnerHTML: { __html: html },
      key: getKey(html, tag)
    });

    return createReactEl(tag, props);
  }

  function createParentEl(tag, props, children) {
    children = prepareChildren(children);
    children = mergeTextNodes(children);

    if (children.every(isString)) {
      return createLeafEl(tag, children.join(''), props);
    } else {
      return createReactEl(tag, props, buildLevel(children));
    }
  }

  function createReactEl(tag, props, children) {
    const args = [tag, props].concat(prepareChildren(children));
    return React.createElement(...args);
  }

  // using string hashing to get unique keys for React
  function getKey(str, tag) {
    const hash = getHashCode(str);
    const conflictCount = conflicts[hash];
    let key = 'html/' + tag + '/' + hash;

    if (conflictCount) {
      key += '/' + conflictCount;
    } else {
      conflicts[hash] = 0;
    }
    conflicts[hash] += 1;

    return key;
  }
}

/**
 * Context-free utilities
 */

function is(item, type) {
  return (
    item.type === type ||
    (type === 'terminal' && TERMINAL_TAGS.indexOf(item.type) > -1) ||
    (type === 'inline' && INLINE_TAGS.indexOf(item.type) > -1)
  );
}

function prepareChildren(nodes) {
  nodes = nodes || [];
  nodes = isArray(nodes) ? nodes : [nodes];

  return nodes;
}

function getSafeHref({ href }) {
  if (isString(href) && isHrefSafe(href)) {
    return href;
  } else {
    return null;
  }
}

// `isHrefSafe` uses relevant parts of Marked's `Renderer.prototype.link`:
// https://github.com/chjj/marked/blob/master/lib/marked.js
//
// Only safety check is perfomed here, no need for HTML construction logic.
//
// Safety check: unescape, decode, remove [^\w:], to lowercase, check if doesn't
// start with a forbidden prefix. Also: catching an error means it's unsafe.
function isHrefSafe(href) {
  try {
    href = decodeURIComponent(unescape(href))
      .replace(/[^\w:]/g, '')
      .toLowerCase();
    return FORBIDDEN_HREF_PREFIXES.every(p => href.indexOf(p) !== 0);
  } catch (e) {
    return false;
  }
}

// `unescape` function is extracted from Marked:
// https://github.com/chjj/marked/blob/master/lib/marked.js
// It was adapted to our code style. No logic changes.
function unescape(html) {
  return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/g, (_, n) => {
    n = n.toLowerCase();
    if (n === 'colon') {
      return ':';
    } else if (n.charAt(0) === '#') {
      if (n.charAt(1) === 'x') {
        return String.fromCharCode(parseInt(n.substring(2), 16));
      } else {
        return String.fromCharCode(+n.substring(1));
      }
    } else {
      return '';
    }
  });
}

function countWords(html, isClean) {
  let clean = isClean ? html : html.replace(HTML_TAGS_RE, '');
  clean = isString(clean) ? clean : '';
  const words = clean.replace(WHITESPACE_RE, ' ').split(' ');

  return words.filter(notEmpty).length;
}

function mergeTextNodes(nodes) {
  return nodes.reduce((merged, node) => {
    let last = merged.length - 1;
    last = last >= 0 ? last : 0;

    if (!isString(node)) {
      merged.push(node);
    } else if (merged.length < 1 || !isString(merged[last])) {
      merged.push(node);
    } else if (isString(merged[last]) && isString(node)) {
      merged[last] += node;
    }
    return merged;
  }, []);
}

// DJB2 hashing algorithm
export function getHashCode(str) {
  return str.split('').reduce((a, b) => (a << 5) + a + b.charCodeAt(0), 5381);
}

function notNull(x) {
  return !isNull(x);
}

function notEmpty(x) {
  return x.length > 0;
}

function accStrings(acc, x) {
  return isString(x) ? acc + x : acc;
}
