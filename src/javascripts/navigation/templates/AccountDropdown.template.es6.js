import { h } from 'utils/legacy-html-hyperscript/index.es6';
import tokens from '@contentful/forma-36-tokens';
import { extend, omit } from 'lodash';

function triangleDown(width = 4, color = tokens.colorTextDark) {
  return {
    border: `${width}px solid transparent`,
    borderTopColor: color
  };
}

export default function() {
  return h('div.account-dropdown.app-top-bar__child', { style: { position: 'relative' } }, [
    h(
      'a.app-top-bar__menu-trigger.app-top-bar__account-menu-trigger',
      {
        role: 'button',
        cfContextMenuTrigger: 'cf-context-menu-trigger',
        tabindex: '0',
        dataTestId: 'account-menu-trigger',
        dataUiTourStep: 'account-menu-trigger',
        style: {
          padding: '0 20px'
        }
      },
      [
        h('img', {
          ngSrc: '{{user.avatarUrl}}',
          dataUserEmail: '{{user.email}}',
          style: {
            borderRadius: '50%',
            width: '25px',
            height: '25px'
          }
        }),
        h('span', {
          style: extend(triangleDown(4, tokens.colorWhite), {
            margin: '2px 0 0 10px'
          })
        })
      ]
    ),
    h(
      'div.context-menu.x--arrow-right',
      {
        role: 'menu',
        cfContextMenu: 'bottom-right-fit',
        ariaLabel: 'Account Menu',
        dataTestId: 'account-menu',
        style: {
          minWidth: '200px'
        }
      },
      [
        {
          text: 'User profile',
          dataTestId: 'nav.account.userProfile',
          uiSref: 'account.profile.user'
        },
        {
          text: 'Talk to us',
          ngClick: 'talkToUsClicked()',
          dataTestId: 'nav.account.intercom',
          ngIf: 'isIntercomEnabled()'
        },
        {
          text: 'Get support',
          href: '{{supportUrl}}',
          dataTestId: 'nav.account.support',
          target: '_blank',
          rel: 'noopener noreferrer'
        },
        {
          text: 'Log out',
          dataTestId: 'nav.account.logout',
          ngClick: 'logout()'
        }
      ].map(dropdownItem)
    )
  ]);
}

function dropdownItem(attrs) {
  const itemAttrs = extend({ role: 'menuitem' }, omit(attrs, 'text'));
  const tag = attrs.href || attrs.cfSref || attrs.uiSref ? 'a' : 'div';
  return h(`${tag}.context-menu__item`, itemAttrs, [attrs.text]);
}