import {omit, kebabCase, mapKeys, isPlainObject} from 'lodash';
import {Hook} from './Hooks/Component';
import * as VTree from './VTree';

/**
 * @description
 * Convenience constructor for virtual DOM nodes.
 *
 * Usage is described in the guide:
 * docs/guides/hyperscript.md
 *
 * @param {string} elSpec
 * @param {{string: string}} props
 * @param {VNode[]} children
 * @returns {VNode} children
 */
export default function h (tag_, props_, children_) {
  const [tag, props, children] = normalize(tag_, props_, children_);
  if (props.hooks && props.hooks.length) {
    const hooks = props.hooks;
    const propsWithoutHooks = omit(props, ['hooks']);
    return VTree.Component(Hook, { tag, props: propsWithoutHooks, children, hooks });
  } else {
    return VTree.Element(tag, props, children);
  }
}

export function normalize (elSpec, props, children) {
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

  const {tag, id, classes} = parseElSpec(elSpec);

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

  children = children
    .filter((c) => !!c)
    .map((c) => {
      if (typeof c === 'string') {
        return VTree.Text(c);
      } else {
        return c;
      }
    });
  return [tag, props, children];
}


const TAG_RE = /^[^#.]+/;
const ID_OR_CLASS_RE = /([#.][^#.]+)/g;

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
