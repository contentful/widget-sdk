import {h} from 'utils/hyperscript';

export default function () {
  return [
    h('cf-persistent-notification', {
      role: 'banner'
    }),
    h('div.app-top-bar', [
      h('div.app-top-bar__logo.app-top-bar__child.app-top-bar--right-separator', [
        h('.app-top-bar__logo-element', {
          cfCustomLogo: 'cf-custom-logo',
        }),
        h('cf-nav-side-panel')
      ]),
      h('div.app-top-bar__child.app-top-bar__main-nav', {
        uiView: 'nav-bar'
      }),
      h('cf-account-dropdown.app-top-bar__child', {
        user: 'user'
      })
    ]),
    h('cf-notifications'),
    h('div.app-container__content', {
      uiView: 'content'
    })
  ].join('');
}
