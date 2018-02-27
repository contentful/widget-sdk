import {h} from 'utils/hyperscript';

export default function template () {
  return h('.home', {'cf-ui-sticky-container': true}, [
    h('.home__container', [
      h('.home__content', [
        h('cf-welcome'),
        h('cf-onboarding-with-tea'),
        // h('cf-onboarding-steps'),
        h('cf-developer-resources')
      ])
    ])
  ]);
}
