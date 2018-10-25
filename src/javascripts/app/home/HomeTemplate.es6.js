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
      h('.home__content', [
        h('.home__content-title', ['You’re viewing a read-only space 🛋']),
        h('.home__content-body', [
          h('p', [
            'All of your existing content is saved, but you canʼt create or edit anything. ',
            h('span', { ngIf: 'orgOwnerOrAdmin' }, ['Get in touch with us to continue work.']),
            h('span', { ngIf: '!orgOwnerOrAdmin' }, [
              'Weʼve informed your Contentful admin about it.'
            ])
          ]),
          h(
            'a.btn-action',
            {
              ngIf: 'orgOwnerOrAdmin',
              target: '_blank',
              href: '{{supportUrl}}'
            },
            ['Talk to support']
          )
        ])
      ])
    ])
  ]);
}
