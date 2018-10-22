import { h } from 'utils/legacy-html-hyperscript';

export default function template() {
  return h('.home', { 'cf-ui-sticky-container': true }, [
    h('.home__container', { ngIf: '!readOnlySpace' }, [
      h('.home__content', [
        h('cf-welcome'),
        h('react-component', { name: 'app/home/UpgradePricing.es6' }),
        h('cf-onboarding-steps'),
        h('cf-developer-resources'),
        h('cf-contact-us-space-home')
      ])
    ]),
    h('.home__container .home__container-read-only', { ngIf: 'readOnlySpace' }, [
      h('.home__content', [h('div', ['Your space is read only!'])])
    ])
  ]);
}
