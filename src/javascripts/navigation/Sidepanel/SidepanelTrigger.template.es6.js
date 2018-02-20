import { h } from 'utils/hyperscript';
import { byName as colors } from 'Styles/Colors';
import logo from 'svg/logo-label';
import environmentIcon from 'svg/environment';

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
        ngIf: 'subtitle',
        style: {
          color: colors.textLight,
          fontSize: '12px',
          lineHeight: '1.5'
        },
        dataTestId: 'sidepanel-trigger-text-subtitle'
      }, ['{{subtitle}}']),
      h('.u-truncate', {
        style: {
          color: '#fff',
          fontSize: '14px',
          lineHeight: '1.2',
          padding: '1px 0'
        },
        dataTestId: 'sidepanel-trigger-text-title'
      }, ['{{title}}']),
      h('.u-truncate', {
        ngIf: 'env',
        style: {
          display: 'flex',
          alignItems: 'center',
          fill: 'currentColor',
          fontSize: '12px',
          lineHeight: '1.5'
        },
        ngStyle: `{color: env === 'master' ? '${colors.greenLight}' : '${colors.orangeLight}'}`
      }, [
        environmentIcon,
        h('div', {style: {marginLeft: '7px'}}, ['{{env}}'])
      ])
    ]),
    h('cf-icon', {
      name: 'hamburger',
      style: {
        fill: 'white'
      }
    })
  ]);
}
