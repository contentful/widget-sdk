import {h} from 'utils/hyperscript';
import * as Workbench from './Workbench';
import {docsLink} from 'ui/Content';


export function template () {
  return Workbench.withSidebar(
    note(),
    sidebar()
  );
}


function sidebar () {
  return [
    h('h2.entity-sidebar__heading', ['Documentation']),
    h('.entity-sidebar__text-profile', [
      h('ul', [
        h('li', [
          'Learn more about the ', docsLink('four content APIs', 'content_apis')
        ]),
        h('li', [
          'Read the ', docsLink('reference docs for the content management API', 'management_api')
        ])
      ])
    ])
  ].join('');
}


function note () {
  return h('.note-box.note-box--info', [
    'To access the management API you need to generate an OAuth token manually. ',
    'Head to the ', docsLink('documentation', 'cma_key'), ' to learn more.'
  ]);
}
