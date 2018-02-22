/* eslint-disable react/prop-types */
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


/**
 * When we create a new VTree elements we standarize prop keys
 * to kebab case. When constructing a concrete React tree some
 * exceptions apply (React prop keys cannot be generated just
 * by converting to camel case for them).
 */
const REACT_PROP_KEY_EXCEPTIONS = {
  'class': 'className',
  'view-box': 'viewBox',
  'dangerously-set-inner-html': 'dangerouslySetInnerHTML'
};

/**
 * Starting from React 16 custom attributes are accepted. They
 * work only if they are not camel cased. This list defines what
 * prop prefixes indicate that a property shouldn't be converted
 * to camel case when constructing a concrete React tree.
 */
const CUSTOM_ATTR_PREFIXES = [
  'data-',
  'aria-',
  'cf-'
];


/**
 * Turns an abstract virtual DOM tree into a concrete React tree.
 */
export function asReact (tree) {
  return caseof(tree, [
    [VTree.Element, ({tag, props, children}) => {
      const reactProps = Object.keys(props).reduce((acc, key) => {
        const value = props[key];
        if (value !== undefined) {
          acc[makeReactPropKey(key)] = makeReactPropValue(key, value);
        }
        return acc;
      }, {});

      return React.createElement(tag, reactProps, ...children.map(asReact));
    }],
    [VTree.Text, ({text}) => text],
    [VTree.Component, ({constructor, args}) => {
      return React.createElement(constructor, { args });
    }],
    [null, () => {
      if (React.isValidElement(tree)) {
        return tree;
      } else {
        throw new Error('Expected a VTree or a valid React element.');
      }
    }]
  ]);
}

function makeReactPropKey (key) {
  if (isCustomAttribute(key)) {
    return key;
  } else if (Object.keys(REACT_PROP_KEY_EXCEPTIONS).indexOf(key) > -1) {
    return REACT_PROP_KEY_EXCEPTIONS[key];
  } else {
    return camelCase(key);
  }
}

function makeReactPropValue (key, value) {
  if (isCustomAttribute(key)) {
    // React requires a string value for custom attributes.
    return value === true ? key : value;
  } else {
    return value;
  }
}

function isCustomAttribute (key) {
  return CUSTOM_ATTR_PREFIXES.some(p => key.indexOf(p) === 0);
}
