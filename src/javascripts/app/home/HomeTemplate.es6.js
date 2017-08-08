import {h} from 'utils/hyperscript';
import { getSvg as getHelpIcon } from 'svg/help-bot-icon';

export default function template () {
  return h('.home', {'cf-ui-sticky-container': true}, [
    h('.home__container', [
      h('.home__content', [
        h('cf-welcome'),
        h('cf-onboarding-steps'),
        h('cf-developer-resources'),
        ninja()
      ])
    ])
  ]);
}

function ninja () {
  return h('section.home-section', {
    ngIf: 'showNinja'
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
          'This helps developers get started with Contentful.',
          h('br'),
          'It offers help on different topics and helps developers learn the basics of Contentful.'
        ]),
        h('.code-block', [
          h('.code-block__line', ['Click on the ‘Help‘ button to access it'])
        ]),
        h('p.home-section__description', [
          'You can hide the help away completely by pressing ',
          h('strong', ['h']),
          '.'
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
