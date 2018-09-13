// hyperscript that produces trees of React.Element
// TODO: use JSX

import { isPlainObject, camelCase, kebabCase, mapKeys } from 'lodash';
import * as React from 'react';
import { Hook } from './Hooks/Component.es6';

export function h(...args) {
  const [tag, props, children] = normalize(...args);

  const reactProps = Object.keys(props).reduce((acc, key) => {
    const value = props[key];
    if (value !== undefined) {
      acc[makeReactPropKey(key)] = makeReactPropValue(key, value);
    }
    return acc;
  }, {});

  // TODO kill this mechanism first
  if (Array.isArray(reactProps.hooks) && reactProps.hooks.length > 0) {
    return React.createElement(Hook, {
      args: {
        tag,
        props: reactProps,
        children,
        hooks: reactProps.hooks
      }
    });
  }

  return React.createElement(tag, reactProps, ...children);
}

export function normalize(elSpec, props, children) {
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
    } else if (key === 'autoFocus' || key === 'tabIndex' || key === 'className') {
      // These are perfectly valid react props.
      return key;
    } else {
      return kebabCase(key);
    }
  });

  return [tag, props, children.filter(c => !!c)];
}

const TAG_RE = /^[^#.]+/;
const ID_OR_CLASS_RE = /([#.][^#.]+)/g;

function parseElSpec(elSpec) {
  if (typeof elSpec === 'function') {
    return { tag: elSpec, classes: [] };
  }

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

/**
 * When we normalize arguments to `h` we standarize prop keys
 * to kebab case. When constructing a React element some
 * exceptions apply (React prop keys cannot be generated just
 * by converting to camel case for them).
 */
const REACT_PROP_KEY_EXCEPTIONS = {
  class: 'className',
  'view-box': 'viewBox',
  'dangerously-set-inner-html': 'dangerouslySetInnerHTML'
};

/**
 * Starting from React 16 custom attributes are accepted. They
 * work only if they are not camel cased. This list defines what
 * prop prefixes indicate that a property shouldn't be converted
 * to camel case when constructing a React element.
 */
const CUSTOM_ATTR_PREFIXES = ['data-', 'aria-', 'cf-'];

function makeReactPropKey(key) {
  if (isCustomAttribute(key)) {
    return key;
  } else if (Object.keys(REACT_PROP_KEY_EXCEPTIONS).indexOf(key) > -1) {
    return REACT_PROP_KEY_EXCEPTIONS[key];
  } else {
    return camelCase(key);
  }
}

function makeReactPropValue(key, value) {
  if (isCustomAttribute(key)) {
    // React requires a string value for custom attributes.
    return value === true ? key : value;
  } else {
    return value;
  }
}

function isCustomAttribute(key) {
  return CUSTOM_ATTR_PREFIXES.some(p => key.indexOf(p) === 0);
}
