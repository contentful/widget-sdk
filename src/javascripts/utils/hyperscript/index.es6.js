import {h, doctype} from './h';
import {constant} from 'lodash';
import {caseofEq} from 'libs/sum-types';

export {h, doctype};

/**
 * @ngdoc method
 * @name utils/hyperscript#styled
 * Creates a 'div' container with the given styles
 *
 * @param {object} style  Map of CSS properties
 * @param {string[]} children  List of children for the container
 * @returns {string}
 */
export function styled (style, children) {
  return h('div', {style}, children);
}


/**
 * @ngdoc method
 * @name utils/hyperscript#text
 * Escape a string for use as an HTML text node.
 *
 * ~~~js
 * h('code', [
 *   text('a < b && c > d')
 * ])
 * ~~~
 *
 * @param {string} text
 * @returns {string}
 */
export function text (t) {
  return t.replace(/<|>|&/g, (c) => {
    return caseofEq(c, [
      ['<', constant('&lt;')],
      ['>', constant('&gt;')],
      ['&', constant('&amp;')]
    ]);
  });
}
