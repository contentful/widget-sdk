import {h} from 'utils/hyperscript';

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
      'Not all who wander are lost'
    ]),
    h('p.home-section__description', [
      'Misao is here to help guide wandering developers get started with Contentful.',
      h('br'),
      'She\'ll tell you about how to use the API and offer some tips and tricks along the way.',
      h('br')
    ]),
    h('code.code-block', [
      'Press \'n\' to start'
    ])
  ]);
}
