import {h} from 'utils/hyperscript';

/**
 * This module exports function to build table components
 */


/**
 * @ngdoc method
 * @name ui/Content/Table#table
 * @description
 * Creates a table from its head and body. Used in conjunction with the
 * `head` and `body` functions.
 *
 * ~~~js
 * table(
 *   head([
 *     [['Name'], {class: 'x--sortable'}],
 *     [['Updated at']]
 *   ])
 *   body({
 *     ngRepeat: 'item in items'
 *   }, [
 *     [['{{item.name'}}], {class: 'x--highlight', onClick: 'item.open()'}]
 *     [['{{item.updatedAt'}}]]
 *   ])
 * )
 * ~~~
 *
 * TODO extend this with bulk actions
 *
 * @param {VNode} head
 * @param {VNode} body
 * @returns {VNode}
 */
export function table (head, body) {
  return h('.table', [
    head, body
  ]);
}


/**
 * @ngdoc method
 * @name ui/Content/Table#head
 * @description
 * Creates a table header from an array of column specs.
 *
 * A column spec is a `[content, props]`. `content` is a list
 * of nodes that give the content of the `th` element. `props` is an
 * optional object of properties for the `th` element.
 *
 * ~~~js
 * head([
 *   [['Name'], {class: 'x--sortable', ngClick: 'sort()'}],
 *   [['Updated', h('em', ['at'])]]
 * ])
 * ~~~
 *
 * @param {Array} items
 * @returns {VNode}
 */
export function head (items) {
  return h('.table__head', [
    h('table', [
      h('thead', [
        h('tr', items.map(([content, props]) => {
          return h('th', props, content);
        }))
      ])
    ])
  ]);
}


/**
 * @ngdoc method
 * @name ui/Content/Table#body
 * @description
 * Creates a table body from an array of column specs.
 *
 * Note that you can specify only one row. This function is intended to
 * be used in conjunction with `ngRepeat`.
 *
 * As in the `head` function a column spec is a `[content, props]`.
 * `content` is a list of nodes that give the content of the `td`
 * element. `props` is an optional object of properties for the `td`
 * element.
 *
 * The `rowProps` parameter is a property object applied to the `tr`
 * element.
 *
 * ~~~js
 * body({
 *   ngRepeat: 'item in items'
 * }, [
 *   [['{{item.name'}}], {class: 'x--highlight', onClick: 'item.open()'}]
 *   [['{{item.updatedAt'}}]]
 * ])
 * ~~~
 *
 * @param {object} rowProps
 * @param {Array} row
 * @returns {VNode}
 */
export function body (rowProps, row) {
  return h('.table__body', [
    h('table', [
      h('tbody', [
        h('tr', rowProps, row.map(([content, props]) => {
          return h('td', props, content);
        }))
      ])
    ])
  ]);
}
