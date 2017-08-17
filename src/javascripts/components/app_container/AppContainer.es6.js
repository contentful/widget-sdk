import {h} from 'utils/hyperscript';
import {extend} from 'lodash';

export default function () {
  return [
    h('cf-persistent-notification', {
      role: 'banner'
    }),
    h('cf-nav-sidepanel', {
      ngIf: 'useNewNavigation',
      isShown: '$parent.sidepanelIsShown'
    }),
    h('div.app-top-bar', [
      h('cf-nav-sidepanel-trigger', {
        ngIf: 'useNewNavigation',
        ngClick: '$parent.sidepanelIsShown = !$parent.sidepanelIsShown'
      }),
      oldLogoAndSpaceSelector({ ngIf: '!useNewNavigation' }),
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


function oldLogoAndSpaceSelector (attrs) {
  const padding = '15px';
  const containerStyle = (style) => extend({
    height: '100%',
    display: 'flex',
    alignItems: 'center'
  }, style);

  return h('div', extend({
    style: containerStyle({ padding: `0 ${padding}` })
  }, attrs), [
    h('.app-top-bar--right-separator', {
      style: containerStyle({ paddingRight: padding })
    }, [
      h('.app-top-bar__logo-element-old', { cfCustomLogo: 'cf-custom-logo' })
    ]),
    h('cf-space-selector')
  ]);
}
