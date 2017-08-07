import { h } from 'utils/hyperscript';

export default function () {
  return h('div.account-dropdown.app-top-bar__child.app-top-bar--left-separator', [
    h('a.app-top-bar__menu-trigger', {
      role: 'button',
      cfContextMenuTrigger: 'cf-context-menu-trigger',
      tabindex: '0',
      dataTestId: 'account-menu-trigger'
    }, [
      h('img.account-dropdown__avatar', {
        ngSrc: '{{user.avatarUrl}}'
      }),
      h('span.account-dropdown__name.u-truncate', ['{{user.firstName}}']),
      h('cf-icon.icon-dd-arrow-down.pull-right', {
        name: 'dd-arrow-down'
      })
    ]),
    h('div.context-menu.x--top-bar.x--arrow-right', {
      role: 'menu',
      cfContextMenu: 'bottom-right',
      ariaLabel: 'Account Menu',
      dataTestId: 'account-menu',
      style: 'min-width: 200px;'
    }, [
      h('a.context-menu__item', {
        role: 'menuitem',
        dataTestId: 'nav.account.userProfile',
        uiSref: 'account.profile.user'
      }, ['User profile']),
      h('a.context-menu__item', {
        role: 'menuitem',
        dataTestId: 'nav.account.organization',
        ngIf: '!useNewNavigation && organizationsRef',
        cfSref: 'organizationsRef'
      }, ['Organizations & billing']),
      h('div.context-menu__item', {
        role: 'menuitem',
        ngClick: 'openIntercom()',
        dataTestId: 'nav.account.intercom',
        ngIf: 'canShowIntercomLink && isIntercomLoaded()'
      }, ['Talk to us']),
      h('a.context-menu__item', {
        role: 'menuitem',
        href: '{{supportUrl}}',
        dataTestId: 'nav.account.support',
        target: '_blank',
        rel: 'noopener noreferrer'
      }, ['Get support']),
      h('div.context-menu__item', {
        role: 'menuitem',
        dataTestId: 'nav.account.logout',
        ngClick: 'logout()'
      }, ['Log out'])
    ])
  ]);
}
