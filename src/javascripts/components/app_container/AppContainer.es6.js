import { h } from 'utils/legacy-html-hyperscript/index.es6';

export default function() {
  return [
    h('cf-persistent-notification', {
      role: 'banner'
    }),
    h('cf-nav-sidepanel', {
      isShown: 'sidePanelIsShown'
    }),
    h('div.app-top-bar', [
      h('cf-nav-sidepanel-trigger', {
        toggleSidePanel: 'toggleSidePanel'
      }),
      h('div.app-top-bar__child.app-top-bar__main-nav', {
        uiView: 'nav-bar'
      }),
      h('react-component', {
        name: 'navigation/templates/AccountDropdown.es6',
        props:
          '{firstName: user.firstName, lastName: user.lastName, avatarUrl: user.avatarUrl, email: user.email}'
      })
    ]),
    h('div.app-container__content', {
      uiView: 'content'
    })
  ].join('');
}
