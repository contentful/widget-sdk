import { range } from 'lodash';
import { h } from 'ui/Framework';
import { vspace, container } from 'ui/Layout.es6';
import { docsLink } from 'ui/Content.es6';
import * as Workbench from 'app/Workbench.es6';
import pageContentTypeIcon from 'svg/page-ct.es6';

/**
 * This module exports the template for the content type editor.
 *
 * We split the template into a couple of functions
 *
 * - export default compose workbench with
 *   - header() uses `Workbench.header()`
 *     - Icon and title
 *     - descriptionAndEdit()  CT description and 'Edit' button
 *     - actions()  Save and actions dropdown with 'Delete' and
 *     'Duplicate'
 *   - tabSelect() Select between 'Fields' and 'JSON Preview' tab
 *   - tabPanel() Slot for fields and JSON preview
 *     - cfContentTypePreview directive
 *     - fields()
 *       - uses fieldActionsContextMenu()
 *     - noFieldsAdvice()
 *   - sidebar()
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
    h('div.workbench-main__sidebar', [sidebar()])
  ])
]);

function header() {
  return Workbench.header({
    title: ['{{contentType.getName()}}'],
    icon: pageContentTypeIcon,
    actions: actions(),
    afterTitle: descriptionAndEdit()
  });

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
      vspace(5),
      h(
        'div',
        {
          ngIf: 'stateIs("^.preview")'
        },
        [h('cf-content-type-preview.u-bce')]
      ),
      h(
        'div',
        {
          ngIf: 'stateIs("^.fields")'
        },
        [
          h('div', { ngIf: 'hasFields' }, [fields()]),
          h('div', { ngIf: '!hasFields' }, [noFieldsAdvice()])
        ]
      )
    ]
  );
}

function noFieldsAdvice() {
  return container(
    {
      position: 'relative',
      maxWidth: '50em'
    },
    [
      h(
        'ul.ct-fields--dummy',
        range(1, 6).map(i => {
          return h('li.ct-field', [
            h('div.ct-field__drag-handle'),
            h('div.ct-field__name', [`Field ${i}`])
          ]);
        })
      ),
      h('div.ct-no-fields-advice.advice', [
        h('div.advice__frame', [
          h('header', [
            h('h1.advice__title', ['It’s time to add some fields']),
            h('div.advice__sub-title', ['Click the blue button on the right'])
          ]),
          h('p.advice__description', [
            'The field type defines what content can be stored.',
            h('br'),
            `For instance, a text field accepts titles and descriptions,
          and a media field is used for images and videos.`
          ])
        ])
      ])
    ]
  );
}

// TODO Do not export. Currently required by tests
export function fields() {
  return h(
    'ul',
    {
      style: {
        maxWidth: '50em',
        position: 'relative'
      },
      // Options are set in ContentTypeEditor controller
      cfUiSortable: true,
      ngModel: 'contentType.data.fields'
    },
    [
      h(
        'li.ct-field',
        {
          ngController: 'ContentTypeFieldController as fieldController',
          ngRepeat: '(index, field) in contentType.data.fields track by field.id',
          ngClass: '{"x--disabled": field.disabled, "x--omitted": field.omitted}',
          role: 'toolbar'
        },
        [
          h('div.ct-field__drag-handle', {
            dataDragHandle: true,
            ngClass: '{"x--no-drag": !data.canEdit}'
          }),
          h('div.ct-field__icon', [h('cf-icon', { ngIf: 'iconId', name: '{{iconId}}' })]),
          h('div.ct-field__name', ['{{field | displayedFieldName}}']),
          h('div.ct-field__type', ['{{fieldTypeLabel}}']),
          h(
            'div.ct-field__status',
            {
              ngIf: '!field.deleted && field.disabled && !field.omitted'
            },
            ['Editing disabled']
          ),
          h(
            'div.ct-field__status',
            {
              ngIf: '!field.deleted && !field.disabled && field.omitted'
            },
            ['Disabled in response']
          ),
          h(
            'div.ct-field__status',
            {
              ngIf: '!field.deleted && field.disabled && field.omitted'
            },
            ['Disabled completely']
          ),
          h(
            'div.ct-field__status',
            {
              ngIf: 'field.deleted'
            },
            ['Deleted']
          ),
          h(
            'div.ct-field__status',
            {
              ngIf: 'fieldIsTitle'
            },
            ['Entry title']
          ),

          h(
            'div',
            {
              ngIf: 'data.canEdit'
            },
            [
              h(
                'button.ct-field__settings.btn-inline',
                {
                  ariaLabel: 'Settings',
                  ngIf: '!field.deleted',
                  ngClick: 'fieldController.openSettingsDialog()'
                },
                ['Settings']
              ),
              h(
                'button.ct-field__actions.btn-inline',
                {
                  type: 'button',
                  ariaLabel: 'Actions',
                  cfContextMenuTrigger: 'cf-context-menu-trigger'
                },
                ['•••']
              ),
              fieldActionsContextMenu()
            ]
          )
        ]
      )
    ]
  );
}

function fieldActionsContextMenu() {
  return h(
    'div.ct-field__actions-menu.context-menu',
    {
      role: 'menu',
      cfContextMenu: 'bottom-4',
      ariaLabel: 'Field Actions',
      dataTestId: 'field-actions-menu'
    },
    [
      h(
        'ul.context-menu__items',
        {
          ngIf: '!field.deleted'
        },
        [
          h(
            'li',
            {
              role: 'menuitem',
              ngClick: 'fieldController.setAsTitle()',
              ngIf: 'fieldCanBeTitle'
            },
            ['Set field as Entry title']
          ),
          h(
            'li',
            {
              role: 'menuitem',
              ngClick: 'fieldController.toggle("disabled")'
            },
            ['{{ field.disabled ? "Enable editing" : "Disable editing" }}']
          ),
          h(
            'li',
            {
              role: 'menuitem',
              ngClick: 'fieldController.toggle("omitted")'
            },
            ['{{ field.omitted ? "Enable in response" : "Disable in response" }}']
          ),
          h(
            'li',
            {
              role: 'menuitem',
              ngClick: 'fieldController.delete()'
            },
            ['Delete']
          )
        ]
      ),
      h(
        'ul.context-menu__items',
        {
          ngIf: 'field.deleted'
        },
        [
          h(
            'li',
            {
              role: 'menuitem',
              ngClick: 'fieldController.undelete()'
            },
            ['Undelete']
          )
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
        vspace(4),
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
      name: '@contentful/ui-component-library/TextInput',
      props: 'buildContentTypeIdInputProps()'
    }),
    // Documentation links
    h('h2.entity-sidebar__heading', ['Documentation']),
    h('ul', [
      h('li', [
        'Read more about content types in our ',
        docsLink('guide to content modelling', 'contentModellingBasics'),
        '.'
      ]),
      h('li', [
        'To learn more about the various ways of disabling and deleting fields have a look at the ',
        docsLink('field lifecycle', 'field_lifecycle'),
        '.'
      ])
    ])
  ]);
}
