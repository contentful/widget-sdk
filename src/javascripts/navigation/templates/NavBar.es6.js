import { h } from 'utils/legacy-html-hyperscript';
import { isBoolean } from 'lodash';
import { byName as Colors } from 'Styles/Colors.es6';

/**
 * @ngdoc method
 * @name navigation/templates/NavBar
 * @param {Object[]} listItems
 * @description
 *
 * Builds template for top navbar, given array of items as parameter.
 * Nav items should have the following format:
 * {
 *   sref: {String},
 *   rootSref: {String?}, // for highlighting the active nav item,
 *                           default is item.sref
 *   title: {String},
 *   dataViewType: {String}, // test identificator
 *   icon: {String?},
 *   if: {String?}, // ngIf expression
 *   inheritUrlParams: {Boolean?} // if links should inherit url params,
 *                                   default: true
 * }
 * or for dropdown:
 * {
 *   rootSref: {String},
 *   title: {String},
 *   dataViewType: {String},
 *   icon: {String?},
 *   if: {String?},
 *   children: [
 *     { title, sref, rootSref, if }
 *   ]
 * }
 */
export default function(listItems = []) {
  return h('nav.nav-bar', [
    h(
      'ul.nav-bar__list',
      listItems.map((data, index) => {
        const html = data.children ? navbarDropdown(data, index) : navbarItem(data);
        const attrs = {};

        if (data.if) {
          attrs.ngIf = data.if;
        }
        if (data.tooltip) {
          attrs.tooltip = data.tooltip;
          attrs.tooltipPlacement = 'bottom';
        }

        return h('li.app-top-bar__action.nav-bar__list-item', attrs, [html]);
      })
    )
  ]);
}

function navbarItem(data) {
  const inheritUrlParams = isBoolean(data.inheritUrlParams) ? data.inheritUrlParams : true;
  const tag = `a.nav-bar__link${data.disabled ? '.is-disabled' : ''}`;

  return h(
    tag,
    data.disabled
      ? {}
      : {
          uiSrefActive: `{ "is-active": "${data.rootSref || data.sref}" }`,
          uiSref: data.sref,
          uiSrefOpts: `{ inherit: ${inheritUrlParams} }`,
          dataViewType: data.dataViewType || '',
          tabindex: String(0)
        },
    [
      h('span.nav-bar__list-label', [
        data.label && h('span.nav-bar__list-top-label', {}, [data.label]),
        data.icon && h('cf-icon', { name: data.icon }),
        data.title
      ])
    ]
  );
}

function navbarDropdown(data, tabIndex = 0) {
  return [
    h(
      'a.nav-bar__link.app-top-bar__menu-trigger',
      {
        role: 'button',
        dataViewType: data.dataViewType || '',
        tabindex: String(tabIndex),
        cfContextMenuTrigger: 'cf-context-menu-trigger',
        uiSrefActive: `{ "is-active": "${data.rootSref || data.sref}" }`
      },
      [
        h('span.nav-bar__list-label', [data.icon && h('cf-icon', { name: data.icon }), data.title]),
        h('span.triangle-down', {
          style: {
            margin: '2px 0 0 12px'
          }
        })
      ]
    ),
    h(
      'div.context-menu',
      {
        role: 'menu',
        cfContextMenu: true,
        dataTestId: 'navbar-dropdown-menu'
      },
      [h('div.context-menu__items', data.children.filter(x => x).map(navbarDropdownItem))]
    )
  ].join('');
}

function navbarDropdownItem(data) {
  if (data.separator) {
    const attrs = {};
    if (data.if) {
      attrs.ngIf = data.if;
    }
    return h('.nav-bar__separator', attrs, [
      h(
        'span',
        {
          style: {
            textTransform: 'uppercase',
            fontWeight: 'bold',
            fontSize: '.85em',
            letterSpacing: '1px'
          }
        },
        [data.label]
      ),
      data.tooltip &&
        h('i.fa.fa-question-circle', {
          style: { marginLeft: '10px', color: Colors.elementMid, cursor: 'pointer' },
          tooltip: data.tooltip,
          tooltipPlacement: 'bottom'
        })
    ]);
  }

  const attrs = {
    role: 'menuitem',
    uiSrefActive: `{ "selected": "${data.rootSref || data.sref}" }`,
    uiSref: data.sref,
    dataViewType: data.dataViewType || ''
  };
  if (data.if) {
    attrs.ngIf = data.if;
  }
  if (data.reload) {
    attrs.uiSrefOpts = '{ reload: true }';
  }

  return h('a.context-menu__item', attrs, [data.title]);
}
