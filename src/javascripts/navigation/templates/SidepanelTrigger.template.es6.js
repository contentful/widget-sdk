import { h } from 'utils/hyperscript';
import { byName as colors } from 'Styles/Colors';
import logo from 'svg/logo-label';

const navPadding = '15px';

export default function () {
  return h('.app-top-bar__sidepanel-trigger', {
    dataTestId: 'sidepanel-trigger'
  }, [
    h('.app-top-bar__logo-element', [logo]),
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
