import {flatten, filter, kebabCase} from 'lodash';

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

export function h (elSpec, attrs, children) {
  if (!children && Array.isArray(attrs)) {
    children = attrs;
    attrs = {};
  }

  if (children && !Array.isArray(children)) {
    throw new Error('Element children have to an array or undefined.');
  }

  const {tag, id, classes} = parseElSpec(elSpec);
  attrs = mergeSpecWithAttrs(id, classes, attrs);
  attrs = rewriteCamelCaseAttrs(attrs);

  return createHTMLString(tag, attrs, children);
}

function rewriteCamelCaseAttrs (attrs) {
  return Object.keys(attrs || {}).reduce((acc, attr) => {
    acc[kebabCase(attr)] = attrs[attr];
    return acc;
  }, {});
}

function parseElSpec (elSpec) {
  elSpec = elSpec.trim();
  const tagMatch = elSpec.match(TAG_RE);
  const idOrClassMatches = elSpec.match(ID_OR_CLASS_RE) || [];
  const result = {tag: 'div', classes: []};

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

function mergeSpecWithAttrs (id, classes, attrs) {
  if (id) {
    attrs.id = id;
  }

  if (classes.length > 0) {
    classes = flatten([attrs.class, classes]);
    attrs.class = filter(classes).join(' ');
  }

  return attrs;
}

function createHTMLString (tag, attrs, children) {
  const isVoid = VOID_ELEMENTS.indexOf(tag) > -1;
  const closeTag = isVoid ? '' : `</${tag}>`;

  if (isVoid || !Array.isArray(children)) {
    children = '';
  } else {
    children = children.join('');
  }

  attrs = Object.keys(attrs).map((attr) => {
    const value = attrs[attr];
    if (value === true) {
      return attr;
    } else {
      return `${attr}="${escape(value)}"`;
    }
  }).join(' ');

  attrs = attrs.length > 0 ? ` ${attrs}` : '';

  return `<${tag}${attrs}>${children}${closeTag}`;
}

function escape (value) {
  return value.replace(DOUBLE_QUOTE_RE, '&quot;');
}
