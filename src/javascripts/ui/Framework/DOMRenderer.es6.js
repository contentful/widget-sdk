import {camelCase} from 'lodash';
import * as React from 'libs/react';
import * as ReactDOM from 'libs/react-dom';
import {caseof} from 'libs/sum-types';
import * as VTree from './VTree';

/**
 * This module exports the function that renders a virtual DOM tree
 * into a real DOM node using React.
 *
 * Rendering is completely stateless. The DOM tree is only updated when
 * the `render()` function is called.
 */

export default function createMountPoint (container) {
  return { render, destroy };

  function render (vtree) {
    ReactDOM.render(asReact(vtree), container);
  }

  function destroy () {
    ReactDOM.unmountComponentAtNode(container);
  }
}


const REACT_PROP_KEY_EXCEPTIONS = {
  'class': 'className',
  'view-box': 'viewBox',
  'dangerously-set-inner-html': 'dangerouslySetInnerHTML'
};

const CUSTOM_ATTR_PREFIXES = [
  'data-',
  'aria-',
  'cf-'
];


/**
 * Turns an abstract virtual DOM tree into a concrete React tree.
 */
function asReact (tree) {
  return caseof(tree, [
    [VTree.Element, ({tag, props, children}) => {
      props = Object.keys(props).reduce((acc, key) => {
        acc[prepareKey(key)] = prepareValue(key, props[key]);
        return acc;
      }, {});

      return React.createElement(tag, props, ...children.map(asReact));
    }],
    [VTree.Text, ({text}) => text]
  ]);
}

function prepareKey (key) {
  if (isCustomAttribute(key)) {
    return key;
  } else if (Object.keys(REACT_PROP_KEY_EXCEPTIONS).indexOf(key) > -1) {
    return REACT_PROP_KEY_EXCEPTIONS[key];
  } else {
    return camelCase(key);
  }
}

function prepareValue (key, value) {
  if (isCustomAttribute(key)) {
    return value === true ? key : value;
  } else {
    return value;
  }
}

function isCustomAttribute (key) {
  return CUSTOM_ATTR_PREFIXES.some(p => key.indexOf(p) === 0);
}
