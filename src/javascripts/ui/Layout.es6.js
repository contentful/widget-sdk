import {h} from 'ui/Framework';

/**
 * @module
 * This module exports layout helpers for building UIs, like
 *
 * - generic containers
 * - spacing elements
 */


/**
 * @ngdoc method
 * @name ui/Layout/container
 * @description
 * Creates a 'div' container with the given styles
 *
 * ~~~js
 * container({
 *   border: '1px solid grey',
 * }, [ '...' ])
 * ~~~
 *
 * @param {object} style  Map of CSS properties
 * @param {string[]} children  List of children for the container
 * @returns {string}
 */
export function container (style, children) {
  return h('div', {style}, children);
}


/**
 * @ngdoc method
 * @name ui/Layout#vspace
 * @description
 * Returns an empty element acting as a vertical space with predefined
 * heights.
 *
 * The spacing amount is determined by the integer key.
 * Note that the spacing is implemented as a 'div' element with a top
 * margin.
 *
 * ~~~js
 * h('div', [
 *   h('div', ['...']),
 *   vspace(3),
 *   h('div', ['...'])
 * ])
 * ~~~
 *
 * @param {number} key  Ranges from 1 to 8
 * @returns {VNode}
 */
export function vspace (key) {
  // Defined by the UI Design Principles
  const height = [4, 8, 14, 20, 28, 40, 60, 80][key - 1];
  if (!height) {
    throw new Error(`Unknown spacing key ${key}`);
  }

  return container({
    marginTop: `${height}px`
  });
}


/**
 * @ngdoc method
 * @name ui/Layout#hfill
 * @description
 * Returns an empty element that pushes all following elemnts to the
 * right in a horizontal flex-box layout.
 *
 * The optional parameter gives the minimum width of the horizontal space.
 *
 * ~~~js
 * container({style: 'flex'}, [
 *   h('div', ['Left'])
 *   hfill('1em')
 *   h('div', ['Flush right'])
 * ])
 * ~~~
 *
 * @param {string} minWidth
 * @returns {VNode}
 */
export function hfill (minWidth) {
  return container({
    marginLeft: 'auto',
    marginRight: minWidth
  });
}
