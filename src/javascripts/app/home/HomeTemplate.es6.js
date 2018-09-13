import { h } from 'utils/legacy-html-hyperscript';

export default function template() {
  return h('.home', { 'cf-ui-sticky-container': true }, [
    h('.home__container', [
      h('.home__content', [
        h('cf-welcome'),
        h('cf-onboarding-steps'),
        h('cf-developer-resources'),
        h('cf-contact-us-space-home')
      ])
    ])
  ]);
}
