import {h} from 'utils/hyperscript';

export default function () {
  return h('nav.nav-bar', {
    ngClass: '{ "with-persistent-notification": persistentNotification }'
  }, [
    h('cf-space-selector'),
    h('ul.nav-bar__list', {
      ngShow: 'spaceContext.space && !spaceContext.space.isHibernated()'
    }, [
      navbarItem({
        if: 'canNavigateTo.spaceHome',
        sref: 'spaces.detail.home',
        selected: '$state.is("spaces.detail.home")',
        dataViewType: 'space_home',
        icon: 'nav-home',
        title: 'Space home'
      }),
      navbarItem({
        if: 'canNavigateTo.contentType',
        sref: 'spaces.detail.content_types.list',
        selected: '$state.includes("spaces.detail.content_types")',
        dataViewType: 'content-type-list',
        icon: 'nav-ct',
        title: 'Content model'
      }),
      navbarItem({
        if: 'canNavigateTo.entry',
        sref: 'spaces.detail.entries.list',
        selected: '$state.includes("spaces.detail.entries")',
        dataViewType: 'entry-list',
        icon: 'nav-entries',
        title: 'Content'
      }),
      navbarItem({
        if: 'canNavigateTo.asset',
        sref: 'spaces.detail.assets.list',
        selected: '$state.includes("spaces.detail.assets")',
        dataViewType: 'asset-list',
        icon: 'nav-media',
        title: 'Media'
      }),
      navbarItem({
        if: 'canNavigateTo.apiKey',
        sref: 'spaces.detail.api.home',
        selected: '$state.includes("spaces.detail.api")',
        dataViewType: 'api-home',
        icon: 'nav-api',
        title: 'APIs'
      }),
      navbarDropdown({
        if: 'canNavigateTo.settings',
        dataViewType: 'space-settings',
        dataTestId: 'settings-menu-trigger',
        selected: '$state.includes("spaces.detail.settings")',
        icon: 'nav-settings',
        title: 'Settings'
      }, [
        {
          sref: 'spaces.detail.settings.space',
          title: 'Space',
          selected: '$state.includes("spaces.detail.settings.space")'
        }, {
          sref: 'spaces.detail.settings.locales.list',
          title: 'Locales',
          selected: '$state.includes("spaces.detail.settings.locales")'
        }, {
          sref: 'spaces.detail.settings.users.list',
          title: 'Users',
          selected: '$state.includes("spaces.detail.settings.users")'
        }, {
          sref: 'spaces.detail.settings.roles.list',
          title: 'Roles',
          selected: '$state.includes("spaces.detail.settings.roles")'
        }, {
          sref: 'spaces.detail.settings.webhooks.list',
          title: 'Webhooks',
          selected: '$state.includes("spaces.detail.settings.webhooks")'
        }, {
          sref: 'spaces.detail.settings.content_preview.list',
          title: 'Content preview',
          selected: '$state.includes("spaces.detail.settings.content_preview")'
        }
      ])
    ])
  ]);
}

function navbarItem (data, tabIndex = 0) {
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

function navbarDropdown (data, items) {
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
