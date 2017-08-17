import {isPlainObject, forEach} from 'lodash';
import {makeSum} from 'libs/sum-types';

/**
 * This module exports the constructors for the abstract virtual DOM
 * tree.
 */

const VTree = makeSum({
  Element (tag, props, children) {
    checkProps(props);
    checkChildren(children);
    return {tag, props, children};
  },
  Text (text) {
    if (typeof text !== 'string') {
      throw new TypeError('Text node must be constructed with a string');
    }
    return {text};
  }
});

export const Element = VTree.Element;
export const Text = VTree.Text;

// Type assertions for elemt properties

function checkProps (props) {
  if (!isPlainObject(props)) {
    throw new TypeError('Element properties must be a plain object');
  }
  forEach(props, (value, key) => {
    if (key === 'style') {
      if (!isPlainObject(value)) {
        throw new TypeError('Style value must be a plain object');
      }
    } else if (key === 'ref') {
      if (typeof value !== 'function') {
        throw new TypeError('Ref handler must be a function');
      }
    } else if (key.substr(0, 3) === 'on-') {
      if (typeof value !== 'function') {
        throw new TypeError(`Event handler ${key} must be a function`);
      }
    } else {
      if (typeof value !== 'string' && value !== true) {
        throw new TypeError(`Element property ${key} must be a string or 'true'`);
      }
    }
  });
}


function checkChildren (children) {
  if (!Array.isArray(children)) {
    throw new TypeError('Element children must be an array');
  }
  children.forEach((value) => {
    if (!(value instanceof VTree)) {
      throw new TypeError('Element child must be a VTree');
    }
  });
}
