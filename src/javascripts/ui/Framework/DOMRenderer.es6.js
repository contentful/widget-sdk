import {camelCase, mapKeys} from 'lodash';
import * as Preact from 'libs/preact';
import {caseof} from 'libs/sum-types';
import * as VTree from './VTree';

/**
 * This module exports the function that renders a virtual DOM tree
 * into a real DOM node using react.
 *
 * Rendering is completely stateless. The DOM tree is only updated when
 * the `render()` function is called.
 */

export default function createMountPoint (container) {
  let prev;
  return { render, destroy };

  function render (vtree) {
    prev = Preact.render(asPreact(vtree), container, prev);
  }

  function destroy () {
    // We explicitly remove the tree from the DOM. Removing the
    // container element is not sufficient to free all resources.
    render(VTree.Element('noscript', {}, []));
  }
}


const PREACT_PROP_KEY_EXCEPTIONS = {
  'view-box': 'viewBox',
  'dangerously-set-inner-html': 'dangerouslySetInnerHTML'
};


/**
 * Turns an abstract virtual DOM tree into a concrete Preact tree.
 */
function asPreact (tree) {
  return caseof(tree, [
    [VTree.Element, ({tag, props, children}) => {
      // Property keys are kebab-cased
      props = mapKeys(props, (_, key) => {
        // For event handlers Preact expects the keys to be camel-cased.
        if (key.substr(0, 3) === 'on-') {
          return camelCase(key);
        }
        // There are some exceptions, as defined in the map
        if (Object.keys(PREACT_PROP_KEY_EXCEPTIONS).indexOf(key) > -1) {
          return PREACT_PROP_KEY_EXCEPTIONS[key];
        }
        return key;
      });
      children = children.map(asPreact);
      return Preact.h(tag, props, children);
    }],
    [VTree.Text, ({text}) => text]
  ]);
}
