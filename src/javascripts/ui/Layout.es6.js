import { h } from 'ui/Framework';

/**
 * @module
 * This module exports layout helpers for building UIs, like
 *
 * - generic containers
 * - scales for lengths and distances
 *   - vheight
 * - spacing elements
 *   - vspace, vspace_
 *   - hspace, hfill
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
export function container(style, children) {
  return h('div', { style }, children);
}

/**
 * @ngdoc method
 * @name ui/Layout#vspace
 * @description
 * Returns an empty element acting as a vertical space with predefined
 * heights.
 *
 * It uses the keyed vertical heights defined in `vheight()`. This
 * function is equivalent to
 *
 *     vspace_(vheight(key) + 'px')
 *
 * @param {number} key  Ranges from 1 to 8
 * @returns {VNode}
 */
export function vspace(key) {
  const height = vheight(key);
  return vspace_(`${height}px`);
}

/**
 * @ngdoc method
 * @name ui/Layout#vheigth
 * @description
 * Returns the height in pixels for a given vertical space key.
 *
 *     vheight(3) // => 14
 *
 * These vertical spaces are defined and used by design to create
 * vertical rhythm. They are used by the `vspace()` function.
 *
 * @param {number} key  Ranges from 1 to 8
 * @returns {VNode}
 */
function vheight(key) {
  // Defined by the UI Design Principles
  const height = [4, 8, 14, 20, 28, 40, 60, 80][key - 1];
  if (!height) {
    throw new Error(`Unknown spacing key ${key}`);
  }
  return height;
}

/**
 * @ngdoc method
 * @name ui/Layout#vspace
 * @description
 * Returns an empty element acting as a vertical space with a given
 * height.
 *
 * Note that the spacing is implemented as a 'div' element with a top
 * margin and is subject to margin collapsing.
 *
 * ~~~js
 * h('div', [
 *   h('div', ['...']),
 *   vspace_('3em'),
 *   h('div', ['...'])
 * ])
 * ~~~
 *
 * @param {String} height  CSS value for the top margin
 * @returns {VNode}
 */
export function vspace_(height) {
  return container({
    marginTop: height
  });
}

/**
 * Create a container with a horizontal flex-box layout
 *
 *     hbox([
 *       ...items
 *     ])
 *
 * With additional style properties
 *
 *     hbox({
 *       width: '100px',
 *     }, [
 *        ...items
 *     ])
 *
 */
export function hbox(style, children) {
  if (arguments.length < 2) {
    children = style;
    style = {};
  }
  return container(
    Object.assign(
      {
        display: 'flex'
      },
      style
    ),
    children
  );
}

/**
 * Create a container with a vertical flex-box layout
 *
 *     vbox([
 *       ...items
 *     ])
 *
 * With additional style properties
 *
 *     vbox({
 *       height: '100px',
 *     }, [
 *        ...items
 *     ])
 *
 */
export function vbox(style, children) {
  if (arguments.length < 2) {
    children = style;
    style = {};
  }
  return container(
    {
      display: 'flex',
      flexDirection: 'column',
      ...style
    },
    children
  );
}

/**
 * @ngdoc method
 * @name ui/Layout#vspace
 * @description
 * Returns an empty element acting as a vertical space with a given
 * height.
 *
 * Note that the spacing is implemented as a 'div' element with a top
 * margin and is subject to margin collapsing.
 *
 * ~~~js
 * h('div', [
 *   h('div', ['...']),
 *   vspace_('3em'),
 *   h('div', ['...'])
 * ])
 * ~~~
 *
 * @param {String} width  CSS value for the left margin
 * @returns {VNode}
 */
export function hspace(width) {
  return container({
    marginLeft: width
  });
}

/**
 * Just like `hspace` but the element has `display: 'inline-block`.
 */
export function ihspace(width) {
  return container({
    display: 'inline-block',
    marginLeft: width
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
export function hfill(minWidth) {
  return container({
    marginLeft: 'auto',
    marginRight: minWidth
  });
}
