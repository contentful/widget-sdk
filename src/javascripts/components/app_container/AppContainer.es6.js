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
      h('div.test-nav-bar', {
        uiView: 'nav-bar'
      })
    ]),
    h('div.app-container__content', {
      uiView: 'content'
    })
  ].join('');
}
