import { h, icons } from 'utils/legacy-html-hyperscript/index.es6';

/**
 * This module exports the template for the content type editor.
 *
 * We split the template into a couple of functions
 *
 * - export default compose workbench with
 *   - header()
 *     - Icon and title
 *     - descriptionAndEdit()  CT description and 'Edit' button
 *     - actions()  Save and actions dropdown with 'Delete' and
 *     'Duplicate'
 *   - tabSelect() Select between 'Fields' and 'JSON Preview' tab
 *   - tabPanel() Slot for fields and JSON preview
 */

// TODO It should be possible to inline a lot of the styles since they
// are not reused.

export default h('div.workbench', [
  header(),
  h('div.workbench-main', [
    h(
      'div.workbench-main__content',
      {
        style: {
          paddingTop: '0'
        }
      },
      [tabSelect(), tabPanel()]
    ),
    h('div.workbench-main__sidebar', { ngIf: 'stateIs("^.preview") || stateIs("^.fields")' }, [
      sidebar()
    ])
  ])
]);

function header() {
  return h('.workbench-header__wrapper', [
    h('header.workbench-header', [
      h('.workbench-header__icon.cf-icon', [icons.pageContentTypes]),
      h('h1.workbench-header__title', ['{{contentType.getName()}}']),
      ...descriptionAndEdit(),
      h('.workbench-header__actions', actions())
    ])
  ]);

  // TODO Wrap this in conditional instead of having `ngIf` on each
  // item. Does not work because CSS sets margin on each child
  function actions() {
    return [
      // Cancel
      h(
        'button.btn-secondary-action',
        {
          ngIf: 'data.canEdit',
          uiCommand: 'actions.cancel'
        },
        ['Cancel']
      ),

      // Actions dropdown trigger
      h(
        'button.btn-secondary-action',
        {
          ngIf: 'data.canEdit',
          cfContextMenuTrigger: 'cf-context-menu-trigger'
        },
        [h('cf-icon.btn-dropdown-icon', { name: 'dd-arrow-down' }), 'Actions']
      ),

      // Actions dropdown
      h(
        'div.context-menu',
        {
          ngIf: 'data.canEdit',
          cfContextMenu: ''
        },
        [
          h(
            'div',
            {
              role: 'menuitem',
              uiCommand: 'actions.duplicate'
            },
            ['Duplicate']
          ),
          h(
            'div',
            {
              role: 'menuitem',
              uiCommand: 'actions.delete'
            },
            ['Delete']
          )
        ]
      ),

      // Save
      h(
        'button.btn-primary-action',
        {
          ngIf: 'data.canEdit',
          uiCommand: 'actions.save'
        },
        ['Save']
      )
    ];
  }

  function descriptionAndEdit() {
    return [
      h('div.workbench-header__description', ['{{contentType.data.description}}']),
      h(
        'button.text-link',
        {
          ngIf: 'data.canEdit',
          uiCommand: 'showMetadataDialog'
        },
        ['Edit']
      )
    ];
  }
}

function tabSelect() {
  return h(
    '.workbench-nav',
    {
      style: {
        position: 'sticky',
        top: '0',
        paddingLeft: '40px',
        zIndex: 1,
        background: 'white'
      }
    },
    [
      h('ul.workbench-nav__tabs', [
        h(
          'li',
          {
            ngClick: 'goTo("fields")',
            ariaSelected: '{{stateIs("^.fields")}}',
            role: 'tab'
          },
          [
            'Fields ',
            h(
              'span',
              {
                ngShow: 'contentType.data.fields.length'
              },
              ['({{contentType.data.fields.length}})']
            )
          ]
        ),
        h(
          'li',
          {
            ngClick: 'goTo("preview")',
            ariaSelected: '{{stateIs("^.preview")}}',
            role: 'tab'
          },
          ['JSON preview']
        ),
        h(
          'li',
          {
            ngClick: 'goTo("sidebar_configuration")',
            ariaSelected: '{{stateIs("^.sidebar_configuration")}}',
            role: 'tab'
          },
          ['Sidebar']
        )
      ])
    ]
  );
}

function tabPanel() {
  return h(
    'form',
    {
      name: 'contentTypeForm',
      style: {
        padding: '0 3em'
      }
    },
    [
      h('div.f36-margin-top--xl'),
      h(
        'div',
        {
          ngIf: 'stateIs("^.fields")'
        },
        [
          h('div', { ngIf: 'hasFields' }, [
            h('react-component', {
              name: 'app/ContentModel/Editor/FieldsTab/FieldsList.es6',
              props:
                '{ fields: contentType.data.fields, canEdit: data.canEdit, displayField: contentType.data.displayField, openFieldDialog: ctEditorController.openFieldDialog, setFieldAsTitle: ctEditorController.setFieldAsTitle, toggleFieldProperty: ctEditorController.toggleFieldProperty, deleteField: ctEditorController.deleteField, undeleteField: ctEditorController.undeleteField, updateOrder: ctEditorController.updateOrder }'
            })
          ]),
          h('div', { ngIf: '!hasFields' }, [
            h('react-component', { name: 'app/ContentModel/Editor/FieldsTab/NoFieldsAdvice.es6' })
          ])
        ]
      ),
      h(
        'div',
        {
          ngIf: 'stateIs("^.preview")'
        },
        [
          h('div.u-bce', [
            h('react-component', {
              name: 'app/ContentModel/Editor/PreviewTab/ContentTypePreview.es6',
              props: 'contentPreviewProps'
            })
          ])
        ]
      ),
      h(
        'div',
        {
          // we're hiding this div, so react component can keep local state
          // while we're navigation beetween tabs
          ngHide: '!stateIs("^.sidebar_configuration")'
        },
        [
          h('.workbench-main__middle-content', [
            h('react-component', {
              name: 'app/EntrySidebar/Configuration/SidebarConfiguration.es6',
              props:
                '{ configuration: sidebarConfiguration, extensions: sidebarExtensions, onUpdateConfiguration: updateSidebarConfiguration }'
            })
          ])
        ]
      )
    ]
  );
}

/**
 * Sidebar includes
 * - Button to add fields
 * - Copyable content type id
 * - Documentation
 */
function sidebar() {
  return h('.entity-sidebar.entity-sidebar__text-profile', [
    // Add field
    h('h2.entity-sidebar__heading', ['Fields']),
    h('p', ['The content type has used {{ data.fieldsUsed }} out of 50 fields.']),

    h(
      'div',
      {
        ngIf: 'data.canEdit'
      },
      [
        h('div.f36-margin-top--l'),
        h(
          'button.btn-action.x--block',
          {
            uiCommand: 'showNewFieldDialog'
          },
          [h('cf-icon.btn-icon.inverted', { name: 'plus' }), 'Add field']
        )
      ]
    ),

    // Content type ID
    h('h2.entity-sidebar__heading', ['Content type ID']),
    h('p', ['Use this ID to retrieve everything related to this content type via the API.']),
    h('react-component', {
      name: '@contentful/forma-36-react-components/TextInput',
      props: 'buildContentTypeIdInputProps()'
    }),
    // Documentation links
    h('h2.entity-sidebar__heading', ['Documentation']),
    h('ul', [
      h('li', [
        'Read more about content types in our ',
        h('react-component', {
          name: 'components/shared/knowledge_base_icon/KnowledgeBase.es6',
          props:
            '{target: "contentModellingBasics", text: "guide to content modelling", inlineText: "true"}'
        }),
        '.'
      ]),
      h('li', [
        'To learn more about the various ways of disabling and deleting fields have a look at the ',
        h('react-component', {
          name: 'components/shared/knowledge_base_icon/KnowledgeBase.es6',
          props: '{target: "field_lifecycle", text: "field lifecycle", inlineText: "true"}'
        }),
        '.'
      ])
    ])
  ]);
}
