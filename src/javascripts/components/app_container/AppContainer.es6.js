import { h } from 'utils/legacy-html-hyperscript';

export default function() {
  return [
    h('cf-persistent-notification', {
      role: 'banner'
    }),
    h('cf-nav-sidepanel', {
      isShown: 'sidePanelIsShown'
    }),
    h('div.app-top-bar', [
      h('react-component', {
        name: 'navigation/Sidepanel/Trigger.es6',
        props: '{onClick: toggleSidePanel}'
      }),
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
