import { h as h_, renderString } from 'ui/Framework';
import { constant } from 'lodash';
import { caseofEq } from 'sum-types';

/**
 * @description
 * Create an HTML string from an HTML element specification.
 *
 * Usage is described in the guide:
 * docs/guides/hyperscript.md
 *
 * @param {string} elSpec
 * @param {{string: string}} attrs
 * @param {string[]} children
 * @returns {string}
 */
export function h(elSpec, attrs, children) {
  return renderString(h_(elSpec, attrs, children));
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
export function text(t) {
  return t.replace(/<|>|&/g, c => {
    return caseofEq(c, [
      ['<', constant('&lt;')],
      ['>', constant('&gt;')],
      ['&', constant('&amp;')]
    ]);
  });
}
