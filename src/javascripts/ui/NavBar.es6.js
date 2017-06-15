import {h} from 'utils/hyperscript';

export function navbarItem (data, tabIndex = 0) {
  const attrs = data.if ? { ngIf: data.if } : {};

  return h('li.app-top-bar__action.nav-bar__list-item', attrs, [
    h('a.nav-bar__link', {
      ngClass: `{ "is-active": ${data.selected} }`,
      uiSref: data.sref,
      dataViewType: data.dataViewType,
      tabindex: tabIndex
    }, [
      h('cf-icon', {
        name: data.icon
      }),
      h('span.nav-bar__list-label', [data.title])
    ])
  ]);
}

export function navbarDropdown (data, items) {
  const attrs = data.if ? { ngIf: data.if } : {};

  return h('li.app-top-bar__action.nav-bar__list-item', attrs, [
    h('a.nav-bar__link.app-top-bar__menu-trigger', {
      role: 'button',
      dataViewType: data.dataViewType,
      cfContextMenuTrigger: 'cf-context-menu-trigger',
      dataTestId: data.dataTestId,
      ngClass: `{ "is-active": ${data.selected} }`
    }, [
      h('cf-icon', {
        name: data.icon
      }),
      h('span.nav-bar__list-label', [data.title]),
      h('cf-icon.icon-dd-arrow-down.pull-right', {
        name: 'dd-arrow-down'
      })
    ]),
    h('div.context-menu.x--top-bar', {
      role: 'menu',
      cfContextMenu: true,
      dataTestId: 'settings-menu'
    }, [
      h('ul.context-menu__items', items.map(navbarDropdownItem))
    ])
  ]);
}

function navbarDropdownItem (data) {
  const attrs = {
    role: 'menuitem',
    ngClass: `{ "selected": ${data.selected} }`,
    uiSref: data.sref
  };
  if (data.if) {
    attrs.ngIf = data.if;
  }

  return h('a.context-menu__item', attrs, [data.title]);
}
