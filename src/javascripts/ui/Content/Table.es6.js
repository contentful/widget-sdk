import {h} from 'ui/Framework';
import {partial} from 'lodash';

/**
 * This module exports function to build table components
 */


/**
 * @ngdoc method
 * @name ui/Content/Table#table
 * @description
 * Creates a table from its head and body. Used in conjunction with the
 * `tr`, `td`, and `th` functions.
 *
 * ~~~js
 * import {table, th, td, tr} from 'ui/Content/Table'
 *
 * const head = [
 *   th(props, content),
 *   // ...
 * ]
 * const body = [
 *   tr(rowProps, [
 *     td(cellProps, content)
 *     // ...
 *   ]),
 *   // ...
 * ]
 *
 * table(head, body)
 * ~~~
 *
 * TODO extend this with bulk actions
 * TODO inline styles
 *
 * @param {VNode} head
 * @param {VNode} body
 * @returns {VNode}
 */
export function table (head, body) {
  return h('.table', [
    h('.table__head', [
      h('table', [
        h('thead', [h('tr', head)])
      ])
    ]),
    h('.table__body', [
      h('table', [
        h('tbody', body)
      ])
    ])
  ]);
}

export const tr = partial(h, 'tr');
export const td = partial(h, 'td');
export const th = partial(h, 'th');
