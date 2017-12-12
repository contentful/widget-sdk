import {h} from 'ui/Framework';
import scaleSvg from 'utils/ScaleSvg';

/**
 * Exports Workbench layouts.
 */

/**
 * Create a workbench template with just a title header and one main
 * content section that is centered in the middle
 *
 * @param {VTree[]}  .title
 * @param {VTree}    .icon     name of an icon to use
 * @param {VTree[]}  .actions  HTML of actions area
 * @param {VTree[]}  content  HTML of content area
 * @returns {VTree}
 */

export function simple ({ title, icon, actions }, content) {
  return h('.workbench', [
    // Workaround for ie11 min-height bug
    // https://github.com/philipwalton/flexbugs#3-min-height-on-a-flex-container-wont-apply-to-its-flex-items
    header({ icon, title, actions, breadcrumbs: false }),
    h('.workbench-main.x--content', [
      h('.workbench-main__middle-content', content)
    ])
  ]);
}


/**
 * Create the template for a workbench header.
 *
 * Renders the breadcrumbs, an optional icon, the title, and optional
 * actions.
 *
 * @param {VTree}     .title    HTML of title
 * @param {boolean}   .breadcrumbs Whether to show the breadcrumbs
 * @param {VTree?}    .icon     name of an icon to use
 * @param {VTree[]?}  .actions  HTML of actions area
 * @param {VTree?}    .afterTitle  Additional HTML that cose after the title
 * @returns {VTree}
 */
export function header ({title, breadcrumbs = true, icon, actions, afterTitle = []}) {
  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [
      breadcrumbs && h('cf-breadcrumbs'),
      icon && h('.workbench-header__icon.cf-icon', [ scaleSvg(icon, 0.75) ]),
      h('h1.workbench-header__title', title),
      ...afterTitle,
      actions && h('.workbench-header__actions', actions)
    ])
  ]);
}
