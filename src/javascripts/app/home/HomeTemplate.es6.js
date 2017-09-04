import {h} from 'utils/hyperscript';
import { getSvg as getHelpIcon } from 'svg/help-bot-icon';

export default function template () {
  return h('.home', {'cf-ui-sticky-container': true}, [
    h('.home__container', [
      h('.home__content', [
        h('cf-welcome'),
        h('cf-onboarding-steps'),
        h('cf-developer-resources'),
        contextualHelpSection()
      ])
    ])
  ]);
}

function contextualHelpSection () {
  return h('section.home-section', {
    ngIf: 'showContextualHelp'
  }, [
    h('h3.home-section__heading', [
      'Contextual help'
    ]),
    h('div', {
      style: {
        display: 'flex'
      }
    }, [
      h('div', {
        style: {
          flexBasis: '80%'
        }
      }, [
        h('p.home-section__description', [
          'It‘s here to help developers learn about Contentful and to make their first few API calls.',
          h('br'),
          'It will show different information about content types, entries and APIs. '
        ]),
        h('.code-block', [
          h('.code-block__line', ['To show or hide help, press ‘H‘'])
        ])
      ]),
      h('div', {
        style: {
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexGrow: 1
        }
      }, [
        getHelpIcon(100, 100)
      ])
    ])
  ]);
}
