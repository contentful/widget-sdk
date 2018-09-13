// hyperscript that generates HTML strings.
// Should be used for Angular templates.
// Nothing particularly wrong about this one
// as long as we need a tool to generate HTML strings.
// Eventually should be eliminated.

import { kebabCase, mapValues, isPlainObject, mapKeys } from 'lodash';

import makeIcons from './icons.es6';

const TAG_RE = /^[^#.]+/;
const ID_OR_CLASS_RE = /([#.][^#.]+)/g;

// Elements that have no content.
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

export const h = htmlH;
export const icons = makeIcons(htmlH);

function htmlH(elSpec, props, children) {
  if (Array.isArray(props)) {
    children = props;
    props = {};
  }

  props = props || {};
  children = children || [];

  if (!isPlainObject(props)) {
    throw new TypeError('Element properties must be a plain object');
  }

  if (!Array.isArray(children)) {
    throw new TypeError('Element children must be an array');
  }

  const { tag, id, classes } = parseElSpec(elSpec);

  if (id) {
    props.id = id;
  }

  if (classes && classes.length) {
    props['class'] = classes.concat(props['class'] || []).join(' ');
  }

  props = mapKeys(props, (_value, key) => {
    if (key.indexOf(':') > -1) {
      // We keep keys that contain a colon as is. (These are namespaced
      // attributes.) Applying `kebabCase` to them would remove the
      // colon and change the behavior of the attribute.
      return key;
    } else if (key === 'viewBox') {
      // This is a special SVG attribute that needs to be camel cased.
      // <svg view-box=...> is not valid.
      return key;
    } else {
      return kebabCase(key);
    }
  });

  props = mapValues(props, (value, key) => {
    return key === 'style' ? renderStyles(value) : value;
  });

  children = children.filter(c => typeof c === 'string').join('');

  return createHTMLString(tag, props, children);
}

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

function renderStyles(styles) {
  if (typeof styles === 'string') {
    return styles;
  } else {
    return Object.keys(styles)
      .map(prop => {
        return `${kebabCase(prop)}: ${styles[prop]}`;
      })
      .join(';');
  }
}

/**
 * Takes a tag name, a string to string map of attributes, and a
 * content string to produce an HTML element.
 */
function createHTMLString(tag, attrs, content) {
  const isVoid = VOID_ELEMENTS.indexOf(tag) > -1;
  const closeTag = isVoid ? '' : `</${tag}>`;

  if (isVoid || !content) {
    content = '';
  }

  attrs = Object.keys(attrs)
    .map(attr => {
      const value = attrs[attr];
      if (value === true) {
        return attr;
      } else {
        const escapedValue = value.replace(/"/g, '&quot;');
        return `${attr}="${escapedValue}"`;
      }
    })
    .join(' ');

  attrs = attrs.length > 0 ? ` ${attrs}` : '';

  return `<${tag}${attrs}>${content}${closeTag}`;
}
