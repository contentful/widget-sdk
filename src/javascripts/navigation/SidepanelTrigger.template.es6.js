import { h } from 'utils/hyperscript';
import { byName as colors } from 'Styles/Colors';

const navPadding = '15px';

export default function () {
  return h('.nav-sidepanel__trigger.app-top-bar--right-separator', {
    dataTestId: 'sidepanel-trigger',
    style: {
      height: '100%',
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${navPadding}`
    }
  }, [
    h('.app-top-bar__logo-element', {
      cfCustomLogo: 'cf-custom-logo'
    }),
    h('.nav-sidepanel__trigger__text', {
      style: {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        justifyContent: 'center',
        paddingLeft: `${navPadding}`
      }
    }, [
      h('span', {
        style: { color: colors.textInverted },
        dataTestId: 'sidepanel-trigger-text-title'
      }, ['{{title}}']),
      h('span', {
        ngIf: 'subtitle',
        style: { color: colors.textLight },
        dataTestId: 'sidepanel-trigger-text-subtitle'
      }, ['{{subtitle}}'])
    ])
  ]);
}
