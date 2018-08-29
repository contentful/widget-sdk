const { isPlainObject, flatten, filter, kebabCase, isString, isNumber } = require('lodash');

const TAG_RE = /^[^#.]+/;
const ID_OR_CLASS_RE = /([#.][^#.]+)/g;
const DOUBLE_QUOTE_RE = /"/g;

const VOID_ELEMENTS = [
  'area',
  'base',
  'br',
  'col',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'command',
  'keygen',
  'source'
];

module.exports.doctype = '<!doctype html>';

/**
 * @ngdoc service
 * @name utils/hyperscript
 * @description
 * This service exposes a function that takes
 * a hyperscript tag specification with attributes
 * and children to generate an HTML string.
 *
 * Usage is described in the guide:
 * docs/guides/hyperscript.md
 */
module.exports.h = function h(elSpec, attrs, children) {
  if (!children && !isPlainObject(attrs)) {
    children = attrs;
    attrs = undefined;
  }

  if (children && !Array.isArray(children)) {
    throw new Error('Element children have to an array or undefined.');
  }

  const { tag, id, classes } = parseElSpec(elSpec);
  attrs = attrs || {};
  attrs = mergeSpecWithAttrs(id, classes, attrs);
  attrs = rewriteCamelCaseAttrs(attrs);
  attrs = rewriteStyles(attrs);

  return createHTMLString(tag, attrs, children);
};

function parseElSpec(elSpec) {
  elSpec = elSpec.trim();
  const tagMatch = elSpec.match(TAG_RE);
  const idOrClassMatches = elSpec.match(ID_OR_CLASS_RE) || [];
  const result = { tag: 'div', classes: [] };

  if (Array.isArray(tagMatch) && tagMatch[0]) {
    result.tag = tagMatch[0];
  }

  return idOrClassMatches.reduce((acc, match) => {
    if (match.charAt(0) === '#') {
      acc.id = match.trim().substr(1);
    } else if (match.charAt(0) === '.') {
      acc.classes.push(match.trim().substr(1));
    }
    return acc;
  }, result);
}

function mergeSpecWithAttrs(id, classes, attrs) {
  if (id) {
    attrs.id = id;
  }

  if (classes.length > 0) {
    classes = flatten([attrs.class, classes]);
    attrs.class = filter(classes).join(' ');
  }

  return attrs;
}

function rewriteCamelCaseAttrs(attrs) {
  return Object.keys(attrs || {}).reduce((acc, attr) => {
    acc[kebabCase(attr)] = attrs[attr];
    return acc;
  }, {});
}

function rewriteStyles(attrs) {
  if (isPlainObject(attrs.style)) {
    attrs.style = Object.keys(attrs.style)
      .map(prop => {
        return `${kebabCase(prop)}: ${escape(attrs.style[prop])}`;
      })
      .join(';');
  }
  return attrs;
}

function createHTMLString(tag, attrs, children) {
  const isVoid = VOID_ELEMENTS.indexOf(tag) > -1;
  const closeTag = isVoid ? '' : `</${tag}>`;

  if (isVoid || !children) {
    children = '';
  } else {
    children = filter(children, child => {
      return isString(child) || isNumber(child);
    }).join('');
  }

  attrs = Object.keys(attrs)
    .map(attr => {
      const value = attrs[attr];
      if (value === true) {
        return attr;
      } else {
        return `${attr}="${escape(value)}"`;
      }
    })
    .join(' ');

  attrs = attrs.length > 0 ? ` ${attrs}` : '';

  return `<${tag}${attrs}>${children}${closeTag}`;
}

function escape(value) {
  if (isString(value)) {
    return value.replace(DOUBLE_QUOTE_RE, '&quot;');
  } else {
    return value;
  }
}
