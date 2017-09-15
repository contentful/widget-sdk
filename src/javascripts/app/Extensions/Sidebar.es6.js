import {h} from 'ui/Framework';
import {docsLink} from 'ui/Content';

export default function Sidebar () {
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
            docsLink('Get started with extensions', 'uiExtensionsGuide')
          ]),
          h('li', [
            docsLink('UI extensions API reference', 'uiExtensions')
          ])
        ])
      ])
    ])
  ]);
}
