import { h, icons } from 'utils/legacy-html-hyperscript';
import * as Colors from 'Styles/Colors.es6';

export default function() {
  const title = [
    '{{ context.title | truncate:50 }}{{ context.dirty ? "*" : "" }}',
    h('cf-knowledge-base.workbench-header__kb-link', { target: 'api_key' })
  ];

  const actions = [
    h(
      'button.btn-secondary-action',
      {
        ngIf: 'apiKeyEditor.canEdit',
        cfContextMenuTrigger: true,
        dataTestId: 'apiKey.delete'
      },
      ['Delete']
    ),
    h('.delete-confirm.context-menu.x--arrow-right', { cfContextMenu: 'bottom-left' }, [
      h('p', ['You are about to delete {{context.title}}']),
      h(
        'button.btn-caution',
        {
          uiCommand: 'apiKeyEditor.remove',
          dataTestId: 'apiKey.deleteConfirm'
        },
        ['Delete']
      ),
      h('button.btn-secondary-action', ['Don’t delete'])
    ]),
    h(
      'button.btn-primary-action',
      {
        uiCommand: 'apiKeyEditor.save',
        dataTestId: 'apiKey.save',
        cfWhenDisabled: 'create.apiKey'
      },
      ['Save']
    )
  ];
  return h('.workbench', [
    h('.workbench-header__wrapper', [
      h('header.workbench-header', [
        h('cf-breadcrumbs'),
        h('.workbench-header__icon.cf-icon', [icons.pageApis]),
        h('h1.workbench-header__title', title),
        h('.workbench-header__actions', actions)
      ])
    ]),
    h('cf-loader', { watchStateChange: 'true' }),
    main()
  ]);
}

function main() {
  return h('.workbench-main.x--content', [
    h('.entity-editor__notification', { ngIf: '!apiKeyEditor.canEdit', role: 'alert' }, [
      h('p', [
        'You have read-only access to this API key. ',
        'If you need to edit it please contact your administrator.'
      ])
    ]),
    h(
      '.api-key-editor__form',
      {
        style: {
          display: 'flex',
          lineHeight: '1.5',
          margin: '1.5rem auto 0',
          padding: '0 5em',
          maxWidth: '90em',
          color: Colors.byName.textMid
        }
      },
      [
        h('div', { ngIf: 'keyEditorComponent' }, [
          h('cf-component-bridge', { component: 'keyEditorComponent' })
        ]),
        h(
          'div',
          {
            style: {
              marginLeft: '4em',
              width: '30em',
              flexShrink: 0
            }
          },
          [
            h('div', { ngIf: 'boilerplateProps' }, [
              h('react-component', {
                name: 'app/api/KeyEditor/Boilerplate.es6',
                props: 'boilerplateProps'
              })
            ]),
            h('div', { ngIf: 'contactUsProps' }, [
              h('react-component', {
                name: 'app/api/KeyEditor/ContactUs.es6',
                props: 'contactUsProps'
              })
            ])
          ]
        )
      ]
    )
  ]);
}
