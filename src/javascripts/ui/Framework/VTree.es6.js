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
    assert(
      typeof text === 'string',
      'Text node must be constructed with a string'
    );
    return {text};
  },
  Component (constructor, args) {
    return {constructor, args};
  }
});

export const Element = VTree.Element;
export const Text = VTree.Text;
export const Component = VTree.Component;

// Type assertions for element properties

function checkProps (props) {
  assert(
    isPlainObject(props),
    'Element properties must be a plain object'
  );
  forEach(props, (value, key) => {
    if (key === 'style') {
      assert(
        isPlainObject(value),
        'Style value must be a plain object'
      );
    } else if (key === 'ref') {
      assert(
        typeof value === 'function',
        'Ref handler must be a function'
      );
    } else if (key === 'disabled' || key === 'checked' || key === 'autofocus') {
      assert(
        typeof value === 'boolean',
        `Element property "${key}" must be a boolean`
      );
    } else if (key === 'dangerously-set-inner-html') {
      assert(
        isPlainObject(value) && typeof value.__html === 'string' && Object.keys(value).length === 1,
        'Setting innerHTML should be done with the "dangerouslySetInnerHTML: {__html: \'<markup />\'}" form'
      );
    } else if (key === 'focus') {
      throw new TypeError('"focus" property is not allowed');
    } else if (key.substr(0, 3) === 'on-') {
      assert(
        typeof value === 'function',
        `Event handler ${key} must be a function`
      );
    } else if (key === 'value') {
      // Any value is allowed
    } else {
      assert(
        typeof value === 'string' || value === true,
        `Element property ${key} must be a string or 'true'`
      );
    }
  });
}

function checkChildren (children) {
  assert(
    Array.isArray(children),
    'Element children must be an array'
  );
  children.forEach((value) => {
    assert(value instanceof VTree, 'Element child must be a VTree');
  });
}


// TODO at some point we should use an assertion library
function assert (value, message) {
  if (!value) {
    throw new Error(message);
  }
}
