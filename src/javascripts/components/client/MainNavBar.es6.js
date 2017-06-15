import {h} from 'utils/hyperscript';
import {navbarItem, navbarDropdown} from 'ui/NavBar';

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
