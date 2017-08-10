import { h } from 'utils/hyperscript';
import { byName as colors } from 'Styles/Colors';
import { triangleDown } from 'Styles/Helpers';
import { extend, omit } from 'lodash';

export default function () {
  return h('div.account-dropdown.app-top-bar__child', [
    h('a.app-top-bar__menu-trigger', {
      role: 'button',
      cfContextMenuTrigger: 'cf-context-menu-trigger',
      tabindex: '0',
      dataTestId: 'account-menu-trigger',
      style: {
        background: colors.contrastMid,
        boxShadow: 'inset 5px 0 6px -2px rgba(0, 0, 0, 0.1)',
        padding: '0 15px'
      }
    }, [
      h('img', {
        ngSrc: '{{user.avatarUrl}}',
        style: {
          borderRadius: '50%',
          width: '24px',
          height: '24px'
        }
      }),
      h('span', {
        style: extend(triangleDown(4, '#fff'), {
          margin: '2px 0 0 10px'
        })
      })
    ]),
    h('div.context-menu.x--top-bar.x--arrow-right', {
      role: 'menu',
      cfContextMenu: 'bottom-right',
      ariaLabel: 'Account Menu',
      dataTestId: 'account-menu',
      style: 'min-width: 200px;'
    }, [
      {
        text: 'User profile',
        dataTestId: 'nav.account.userProfile',
        uiSref: 'account.profile.user'
      }, {
        text: 'Organizations & billing',
        dataTestId: 'nav.account.organization',
        ngIf: '!useNewNavigation && organizationsRef',
        cfSref: 'organizationsRef'
      }, {
        text: 'Talk to us',
        ngClick: 'openIntercom()',
        dataTestId: 'nav.account.intercom',
        ngIf: 'canShowIntercomLink && isIntercomLoaded()'
      }, {
        text: 'Get support',
        href: '{{supportUrl}}',
        dataTestId: 'nav.account.support',
        target: '_blank',
        rel: 'noopener noreferrer'
      }, {
        text: 'Log out',
        dataTestId: 'nav.account.logout',
        ngClick: 'logout()'
      }
    ].map(dropdownItem))
  ]);
}

function dropdownItem (attrs) {
  const itemAttrs = extend({ role: 'menuitem' }, omit(attrs, 'text'));
  const tag = (attrs.href || attrs.cfSref || attrs.uiSref) ? 'a' : 'div';
  return h(`${tag}.context-menu__item`, itemAttrs, [attrs.text]);
}
