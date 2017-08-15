import { h } from 'utils/hyperscript';
import { byName as colors } from 'Styles/Colors';

const navPadding = '15px';

export default function () {
  return h('.nav-sidepanel__trigger', {
    dataTestId: 'sidepanel-trigger',
    style: {
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      padding: `0 ${navPadding}`,
      lineHeight: '1.5',
      width: '277px',
      background: colors.contrastMid,
      boxShadow: 'inset -5px 0 6px -2px rgba(0, 0, 0, 0.1)'
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
        flexGrow: 99,
        overflow: 'hidden',
        justifyContent: 'center',
        padding: `0 ${navPadding}`
      }
    }, [
      h('span.u-truncate', {
        style: { color: '#fff' },
        dataTestId: 'sidepanel-trigger-text-title'
      }, ['{{title}}']),
      h('span.u-truncate', {
        ngIf: 'subtitle',
        style: { color: colors.textLight },
        dataTestId: 'sidepanel-trigger-text-subtitle'
      }, ['{{subtitle}}'])
    ]),
    h('cf-icon', {
      name: 'hamburger',
      style: {
        fill: 'white'
      }
    })
  ]);
}
