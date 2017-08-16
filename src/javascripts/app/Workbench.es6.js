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
 * Create a workbench template with just a title header and one main
 * content section
 *
 * @param {string}  title
 * @param {string}  icon     name of an icon to use
 * @param {string}  actions  HTML of actions area
 * @param {string}  content  HTML of content area
 * @returns {string}
 */

export function simple (title, icon, actions, content) {
  return [
    // Workaround for ie11 min-height bug
    // https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [
        icon && h('cf-icon.workbench-header__icon', {name: icon}),
        h('h1.workbench-header__title', [title]),
        actions && h('.workbench-header__actions', actions)
      ])
    ]),
    h('.workbench-main.x--content', [
      h('.workbench-main__middle-content', content)
    ])
  ].join('');
}


/**
 * @ngdoc method
 * @name app/Workbench#header
 * @description
 * Create the template for a workbench header.
 *
 * Renders the breadcrumbs, an optional icon, the title, and optional
 * actions.
 *
 * @param {string}     title    HTML of title
 * @param {string?}    icon     name of an icon to use
 * @param {string[]?}  actions  HTML of actions area
 * @param {string?}    afterTitle  Additional HTML that cose after the title
 * @returns {string}
 */
export function header (title, icon, actions, afterTitle) {
  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [
      h('cf-breadcrumbs'),
      icon && h('cf-icon.workbench-header__icon', {name: icon}),
      h('h1.workbench-header__title', [title]),
      afterTitle,
      actions && h('.workbench-header__actions', actions)
    ])
  ]);
}
