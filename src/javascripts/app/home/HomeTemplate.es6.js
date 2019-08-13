import { h } from 'utils/legacy-html-hyperscript/index.es6';

export default function template() {
  return h('.home', { 'cf-ui-sticky-container': true }, [
    h('.home__empty-state', { ngIf: '!hasSpace' }, [
      h('react-component', {
        name: 'app/home/EmptySpaceHome.es6',
        props: '{orgOwnerOrAdmin:orgOwnerOrAdmin, lastUsedOrg:lastUsedOrg}'
      })
    ]),
    h('div', { ngIf: 'hasSpace' }, [
      h(
        '.home__container-practitioner',
        {
          ngIf: 'isAuthorOrEditor && !readOnlySpace'
        },
        [
          h('react-component', {
            name: 'app/home/AuthorEditorSpaceHome.es6',
            props: 'spaceHomeProps'
          })
        ]
      ),
      h('.home__container', { ngIf: 'isSpaceAdmin && !readOnlySpace' }, [
        h('.home__content', [
          h('react-component', { name: 'app/home/welcome/Welcome.es6', props: 'welcomeProps' }),
          h('react-component', { name: 'app/home/UpgradePricing.es6' }),
          h('cf-onboarding-steps'),
          h('react-component', {
            name: 'app/home/developer_resources/DeveloperResourcesComponent.es6'
          }),
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
    ])
  ]);
}
