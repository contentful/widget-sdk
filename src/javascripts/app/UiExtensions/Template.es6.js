import {h} from 'utils/hyperscript';
import {docsLink} from 'ui/Content';

export default function template () {
  return h('.workbench', [
    h('header.workbench-header', [
      h('cf-icon.workbench-header__icon', {name: 'page-settings'}),
      h('h1.workbench-header__title', ['Extensions'])
    ]),
    h('.workbench-main', [
      h('cf-component-bridge.workbench-main__content', {
        component: 'component'
      }),
      sidebar()
    ])
  ]);
}

function sidebar () {
  return h('.workbench-main__sidebar', [
    h('.entity-sidebar', [
      h('h2.entity-sidebar__heading', ['Documentation']),
      h('.entity-sidebar__text-profile', [
        h('p', [
          `The UI extensions SDK allows you to build customized editing
          experiences for the Contentful web application.`
        ]),
        h('p', [
          'Learn more about UI extensions: '
        ]),
        h('ul', [
          h('li', [
            docsLink('UI Extensions API reference', 'uiExtensions')
          ]),
          h('li', [
            docsLink('Getting started guide', 'uiExtensionsGuide')
          ])
        ])
      ])
    ])
  ]);
}
