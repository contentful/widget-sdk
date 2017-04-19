import {h} from 'utils/hyperscript';
import {container, vspace} from 'ui/Layout';
import {docsLink, linkOpen, p} from 'ui/Content';

import * as Workbench from '../Workbench';


export default function template () {
  return Workbench.withSidebar(
    h('div', {
      style: {
        padding: '2em 3em'
      }
    }, [
      main()
    ]),
    sidebar()
  );
}


function main () {
  return [
    h('h1.section-title', ['OAuth tokens']),
    p([
      'OAuth tokens are issued by ', linkOpen(['OAuth applications'], '/account/profile/developers/applications'),
      ` and represent the user who granted access through this
      application. These tokens have the same rights as the owner of
      the account. You can `,
      docsLink('learn more about OAuth appliactions in our documentation', 'createOAuthApp'),
      '.'
    ]),
    vspace(7),
    h('h1.section-title', ['Personal Access Tokens']),
    container({
      display: 'flex'
    }, [
      p([
        `Alternatively to using OAuth applications, you can also use
        Personal Access Tokens to use the Content Management API. These
        tokens are always bound to your individual account, with the
        same permissions you have on all of your spaces and
        organizations.`
      ]),
      container({
        marginLeft: '1em',
        flex: '0 0 auto'
      }, [
        h('button.btn-action', {ngClick: 'openCreateDialog()'}, ['Generate personal token'])
      ])
    ])

  ].join('');
}
function sidebar () {
  return [
    h('h2.entity-sidebar__heading', ['Documentation']),
    h('.entity-sidebar__text-profile', [
      p([
        `The Content Management API, unlike the Content Delivery API,
        provides read and write access to your Contentful spaces. This
        enables integrating content management to your development
        workflow, perform automation operations…`
      ]),
      h('ul', [
        h('li', [
          docsLink('Content Management API reference', 'management_api')
        ]),
        h('li', [
          docsLink('Other Contentful APIs', 'content_apis')
        ])
      ])
    ])
  ].join('');
}
