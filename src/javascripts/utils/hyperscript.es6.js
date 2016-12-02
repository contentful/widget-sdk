const TAG_RE = /^[^#.]+/;
const ID_OR_CLASS_RE = /([#.][^#.]+)/g;

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

export function h (elementSpec, attrs, children) {
  // arity 1: array of children -> join, string -> empty tag
  if (arguments.length === 1 && Array.isArray(elementSpec)) {
    children = elementSpec;
    return children.join('');
  }

  // arity 2: no attributes
  if (!children && isChildren(attrs)) {
    children = attrs;
    attrs = {};
  }

  attrs = attrs || {};

  const parsed = parseElementSpec(elementSpec);
  attrs.id = parsed.id || attrs.id;
  if (parsed.classes.length > 0) {
    attrs.class = parsed.classes.join(' ');
  }

  return createHTMLString(parsed.tag, attrs, children);
}

function isChildren (x) {
  return typeof x === 'string' || typeof x === 'number' || Array.isArray(x);
}

function parseElementSpec (elementSpec) {
  elementSpec = elementSpec.trim();
  const tagMatch = elementSpec.match(TAG_RE);
  const idOrClassMatches = elementSpec.match(ID_OR_CLASS_RE) || [];
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

function createHTMLString (tag, attrs, children) {
  const isVoid = VOID_ELEMENTS.indexOf(tag) > -1;
  const closeTag = isVoid ? '' : `</${tag}>`;

  if (!isChildren(children) || isVoid) {
    children = '';
  } else if (Array.isArray(children)) {
    children = children.join('');
  }

  attrs = Object.keys(attrs).map((attr) => {
    const value = attrs[attr];
    if (value === true) {
      return attr;
    } else {
      return `${attr}="${value}"`;
    }
  }).join(' ');

  attrs = attrs.length > 0 ? ` ${attrs}` : '';

  return `<${tag}${attrs}>${children}${closeTag}`;
}
