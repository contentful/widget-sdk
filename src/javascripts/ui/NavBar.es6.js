import {h} from 'utils/hyperscript';

export function navBar (listItems) {
  return h('nav.nav-bar', [
    h('cf-space-selector'),
    h('ul.nav-bar__list', listItems.map(function (data, index) {
      const html = data.children ? navbarDropdown(data, index) : navbarItem(data, index);
      const attrs = data.if ? { ngIf: data.if } : {};
      return h('li.app-top-bar__action.nav-bar__list-item', attrs, [html]);
    }))
  ]);
}

function navbarItem (data, tabIndex = 0) {
  return h('a.nav-bar__link', {
    ngClass: `{ "is-active": $state.includes("${data.rootSref || data.sref}") }`,
    uiSref: data.sref,
    dataViewType: data.dataViewType,
    tabindex: tabIndex
  }, [
    h('cf-icon', { name: data.icon }),
    h('span.nav-bar__list-label', [data.title])
  ]);
}

function navbarDropdown (data, tabIndex = 0) {
  return [
    h('a.nav-bar__link.app-top-bar__menu-trigger', {
      role: 'button',
      dataViewType: data.dataViewType,
      tabindex: tabIndex,
      cfContextMenuTrigger: 'cf-context-menu-trigger',
      dataTestId: data.dataTestId,
      ngClass: `{ "is-active": $state.includes("${data.rootSref || data.sref}") }`
    }, [
      h('cf-icon', { name: data.icon }),
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
      h('ul.context-menu__items', data.children.map(navbarDropdownItem))
    ])
  ].join('');
}

function navbarDropdownItem (data) {
  const attrs = {
    role: 'menuitem',
    ngClass: `{ "selected": $state.includes("${data.rootSref || data.sref}") }`,
    uiSref: data.sref
  };
  if (data.if) {
    attrs.ngIf = data.if;
  }

  return h('a.context-menu__item', attrs, [data.title]);
}
