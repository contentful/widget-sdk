import $sanitize from '$sanitize';
import {extend, isString, isObject, isArray, isNull} from 'lodash';
import {htmlDecode} from 'encoder';
import tokenStore from 'tokenStore';
import MarkedAst from 'libs/MarkedAst';

let currentId = 1;

const TERMINAL_TAGS = ['br', 'hr'];
const INLINE_TAGS = ['strong', 'em', 'del'];
const HTML_TAGS_RE = /<\/?[^>]+(>|$)/g;
const WHITESPACE_RE = /\s+/g;
const NEWLINE_ENTITY_RE = new RegExp('&#10;', 'g');
const EMBEDLY_CLASS_RE = new RegExp('class="embedly-card"', 'g');
const EMBEDLY_CLASS_REPLACEMENT = 'class="embedly-card markdown-block" data-card-controls="0"';
const IMAGES_API_DEFAULT_H = 200;

/**
 * Given an object of vendor packages it returns a
 * function that takes a markdown string and produces preview
 * information.
 *
 * The object returned by the preview generator has two properties:
 * - `root` React element containing the root node of the preview.
 * - `words` an integer giving the number of words in the MD source
 *
 * The 'libs' object is the one exported by the
 * `libs/markdown_vendor.js`.
 */
export default function create ({React}) {
  const rootKey = 'root/' + currentId;
  let conflicts = {};
  let words = 0;

  currentId += 1;

  return function buildTree (source) {
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

    const result = { root: createRootEl(ast), words: words };
    conflicts = {};
    words = 0;
    return result;
  };

  function buildLevel (level) {
    return (level || [])
      .map(processItem)
      .filter(notNull);
  }

  function processItem (item, i) {
    if (isString(item)) { return createFragmentEl(item); }
    if (!isObject(item)) { return null; }
    if (is(item, 'paragraph')) { return createParagraphEl(item, i); }
    if (is(item, 'inline')) { return createInlineEl(item, i); }
    if (is(item, 'heading')) { return createHeadingEl(item, i); }
    if (is(item, 'image')) { return createImageEl(item, i); }
    if (is(item, 'link')) { return createLinkEl(item, i); }
    if (is(item, 'list')) { return createListEl(item, i); }
    if (is(item, 'listitem')) { return createListItemEl(item, i); }
    if (is(item, 'terminal')) { return createTerminalEl(item, i); }
    if (is(item, 'blockquote')) { return createQuoteEl(item, i); }
    if (is(item, 'code')) { return createCodeBlockEl(item, i); }
    if (is(item, 'codespan')) { return createCodeSpanEl(item, i); }
    if (is(item, 'table')) { return createTableEl(item, i); }
    if (is(item, 'tablerow')) { return createTableRowEl(item, i); }
    if (is(item, 'tablecell')) { return createTableCellEl(item, i); }
    if (is(item, 'html')) { return createHtmlEl(item, i); }
    return null;
  }

  /**
   * Creating elements for AST parts
   */

  function createRootEl (ast) {
    return createReactEl('div', { key: rootKey }, buildLevel(ast));
  }

  function createFragmentEl (item) {
    return createLeafEl('div', item, { className: 'markdown-fragment' });
  }

  function createParagraphEl (item, key) {
    const props = { key: key, className: 'markdown-paragraph markdown-block' };
    return createParentEl('div', props, item.text);
  }

  function createInlineEl (item, key) {
    const props = { key: key, className: 'markdown-fragment' };
    return createParentEl(item.type, props, item.text);
  }

  function createHeadingEl (item, key) {
    const headingType = 'h' + item.level;
    const props = { key: key, className: 'markdown-heading markdown-block' };
    return createParentEl(headingType, props, item.text);
  }

  function createListEl (item, key) {
    const listType = item.ordered ? 'ol' : 'ul';
    const props = { key: key, className: 'markdown-list markdown-block' };
    return createParentEl(listType, props, item.body);
  }

  function createListItemEl (item, key) {
    return createParentEl('li', { key: key }, item.text);
  }

  function createImageEl (item, key) {
    const src = isString(item.href) ? prepareImageSrc(item.href) : null;
    const imgEl = createReactEl('img', { src, title: item.title, alt: item.text });
    const props = { key: key, className: 'markdown-image-placeholder markdown-block' };
    return createReactEl('div', props, imgEl);
  }

  function prepareImageSrc (src) {
    // AST contains an encoded URL.
    // React expects decoded one to handle on its own.
    src = htmlDecode(src);
    const domain = tokenStore.getDomains().images || 'images.contentful.com';

    return src.indexOf(domain) > -1 ? prepareImagesAPISrc(src) : src;
  }

  function prepareImagesAPISrc (src) {
    const qs = src.split('?')[1];

    if (isString(qs) && qs.length > 0) {
      return qs.indexOf('h=') > -1 ? src : `${src}&h=${IMAGES_API_DEFAULT_H}`;
    } else {
      return `${src}?h=${IMAGES_API_DEFAULT_H}`;
    }
  }

  function createLinkEl (item, key) {
    return createParentEl('a', {
      key: key,
      href: getSafeHref(item),
      title: item.title,
      target: '_blank',
      rel: 'noopener noreferrer'
    }, item.text);
  }

  function createTerminalEl (item, key) {
    return createReactEl(item.type, { key: key });
  }

  function createQuoteEl (item, key) {
    const props = { key: key, className: 'markdown-quote markdown-block' };
    return createParentEl('blockquote', props, item.quote);
  }

  function createCodeBlockEl (item, key) {
    const codeEl = createReactEl('code', null, item.code);
    const props = { key: key, className: 'markdown-code markdown-block' };
    return createReactEl('pre', props, codeEl);
  }

  function createCodeSpanEl (item, key) {
    const props = { key: key, className: 'markdown-fragment' };
    return createParentEl('code', props, item.text);
  }

  function createTableEl (item, key) {
    const headerEl = createReactEl('thead', { key: 'table/head/' + key }, buildLevel(item.header));
    const bodyEl = createReactEl('tbody', { key: 'table/body/' + key }, buildLevel(item.body));
    const props = { key: key, className: 'markdown-table markdown-block' };
    return createReactEl('table', props, [headerEl, bodyEl]);
  }

  function createTableCellEl (item, key) {
    const cellType = item.flags.header ? 'th' : 'td';
    return createParentEl(cellType, { key: key }, item.content);
  }

  function createTableRowEl (item, key) {
    return createParentEl('tr', { key: key }, item.content);
  }

  function createHtmlEl (item, key) {
    const props = { key: key, className: 'markdown-html markdown-block' };

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

  function createLeafEl (tag, html, props) {
    const isClean = html.indexOf('<') < 0;

    if (!isClean) { html = sanitize(html); }
    if (!html.length) { return null; }

    words += countWords(html, isClean);
    props = extend(props || {}, {
      dangerouslySetInnerHTML: { __html: html },
      key: getKey(html, tag)
    });

    return createReactEl(tag, props);
  }

  function createParentEl (tag, props, children) {
    children = prepareChildren(children);
    children = mergeTextNodes(children);

    if (children.every(isString)) {
      return createLeafEl(tag, children.join(''), props);
    } else {
      return createReactEl(tag, props, buildLevel(children));
    }
  }

  function createReactEl (tag, props, children) {
    const args = [tag, props].concat(prepareChildren(children));
    return React.createElement.apply(React, args);
  }

  // using string hashing to get unique keys for React
  function getKey (str, tag) {
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

function is (item, type) {
  return (
    (item.type === type) ||
    (type === 'terminal' && TERMINAL_TAGS.indexOf(item.type) > -1) ||
    (type === 'inline' && INLINE_TAGS.indexOf(item.type) > -1)
  );
}

function prepareChildren (nodes) {
  nodes = nodes || [];
  nodes = isArray(nodes) ? nodes : [nodes];

  return nodes;
}

function sanitize (html) {
  html = $sanitize(html);
  html = html.replace(NEWLINE_ENTITY_RE, '\n');
  html = html.replace(EMBEDLY_CLASS_RE, EMBEDLY_CLASS_REPLACEMENT);

  return html;
}

function getSafeHref (item) {
  // There's no value in trying to be permissive
  // in the preview; sanitize all js: and data: URIs
  const notJs = item.href.substr(0, 11) !== 'javascript:';
  const notData = item.href.substr(0, 5) !== 'data:';

  if (isString(item.href) && notJs && notData) {
    return item.href;
  } else {
    return null;
  }
}

function countWords (html, isClean) {
  let clean = isClean ? html : html.replace(HTML_TAGS_RE, '');
  clean = isString(clean) ? clean : '';
  const words = clean.replace(WHITESPACE_RE, ' ').split(' ');

  return words.filter(notEmpty).length;
}

function mergeTextNodes (nodes) {
  return nodes.reduce(function (merged, node) {
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
export function getHashCode (str) {
  return str.split('').reduce(function (a, b) {
    return ((a << 5) + a) + b.charCodeAt(0);
  }, 5381);
}

function notNull (x) {
  return !isNull(x);
}

function notEmpty (x) {
  return x.length > 0;
}

function accStrings (acc, x) {
  return isString(x) ? (acc + x) : acc;
}
