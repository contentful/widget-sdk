import {h} from 'utils/hyperscript';

/**
 * @ngdoc service
 * @name app/Workbench
 * @description
 * Exports Workbench hyperscript layouts.
 */

/**
 * @ngdoc method
 * @name app/Workbench#simple
 * @description
 * Simple layout for Workbench.
 *
 * @param {string}  title
 * @param {string}  icon     name of an icon to use
 * @param {string}  actions  HTML of actions area
 * @param {string}  content  HTML of content area
 * @returns {string}
 */

export function simple (title, icon, actions, content) {
  return [
    h('header.workbench-header', [
      icon && h('cf-icon.workbench-header__icon', {name: icon}),
      h('h1.workbench-header__title', [title]),
      actions && h('.workbench-header__actions', actions)
    ]),
    h('.workbench-main.x--content', [
      h('.workbench-main__middle-content', content)
    ])
  ].join('');
}
