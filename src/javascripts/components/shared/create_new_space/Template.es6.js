import { h } from 'utils/hyperscript';
import spinner from 'ui/Components/Spinner.es6';

export default function() {
  return h('div.create-new-space-dialog.modal-dialog', [
    h('div.modal-dialog__header.create-new-space-dialog__header', [
      h('button.create-new-space-dialog__close.modal-dialog__close', {
        ngIf: "createSpace.viewState === 'createSpaceForm'",
        ngClick: 'dialog.cancel()'
      })
    ]),
    renderCreateSpaceDialog(),
    renderCreateSpaceInProgress()
  ]);
}

function renderCreateSpaceDialog() {
  const headers = {
    onboarding: 'Let’s create your first space now',
    default: 'Create a new space'
  };
  return h(
    'form',
    {
      ngShow: 'createSpace.viewState === "createSpaceForm"',
      ngSubmit: 'createSpace.requestSpaceCreation()',
      name: 'newSpaceForm'
    },
    [
      h('div.create-new-space-dialog__content.modal-dialog__content', [
        h('h2.create-new-space-dialog__heading', [
          `{{createSpace.isOnboarding ? "${headers.onboarding}" : "${headers.default}"}}`
        ]),
        h('p.create-new-space-dialog__subheading', [
          'A space is a place where you keep all the content related to a single project. <br> You are creating this space for the organization <em>{{createSpace.newSpace.organization.name}}</em>.'
        ]),
        renderCreateSpaceForm(),
        renderSpaceTemplates()
      ]),
      h('div.modal-dialog__controls.create-new-space-dialog__controls--right', [
        h(
          'button.btn-action',
          {
            ngClass: "{'is-loading': createSpace.createSpaceInProgress}",
            ngDisabled: 'createSpace.createSpaceInProgress',
            dataTestId: 'create-space'
          },
          ['Create space']
        )
      ])
    ]
  );
}

function renderCreateSpaceForm() {
  return h('div.create-new-space__form', [
    h('div.create-new-space__fieldset', [
      renderSpaceNameInput(),
      renderLanguageSelect(),
      renderRatePlanSelect()
    ]),
    h(
      'div.cfnext-form__field',
      {
        ngShow: 'createSpace.newSpace.errors.form'
      },
      [h('div.cfnext-form__field-error', ['{{createSpace.newSpace.errors.form}}'])]
    ),
    renderTemplateToggle()
  ]);
}

function renderSpaceNameInput() {
  return h('div.cfnext-form__field', [
    h(
      'label',
      {
        for: 'newspace-name'
      },
      [h('strong', ['Space name'])]
    ),
    h('input#newspace-name.cfnext-form__input', {
      id: 'newspace-name',
      ngModel: 'createSpace.newSpace.data.name',
      ngRequired: 'required',
      cfFocusOnRender: 'cf-focus-on-render',
      type: 'text',
      ngDisabled: 'createSpace.createSpaceInProgress',
      ariaInvalid: '{{!!createSpace.newSpace.errors.fields.name}}'
    }),
    renderErrorLabel('createSpace.newSpace.errors.fields.name')
  ]);
}

function renderLanguageSelect() {
  return h(
    'div.cfnext-form__field',
    {
      ngStyle: '{ visibility: createSpace.newSpace.useTemplate === false ? "visible" : "hidden" }'
    },
    [
      h('label', [h('strong', ['Language'])]),
      h('select.cfnext-select-box', {
        dataTestId: 'select-locale',
        ngModel: 'createSpace.newSpace.data.defaultLocale',
        ngOptions: 'opt.code as opt.displayName for opt in createSpace.localesList',
        ngDisabled: 'createSpace.createSpaceInProgress',
        ariaInvalid: '{{!!createSpace.newSpace.errors.fields.default_locale}}'
      }),
      renderErrorLabel('createSpace.newSpace.errors.fields.default_locale')
    ]
  );
}

function renderRatePlanSelect() {
  return h(
    'div.cfnext-form__field',
    {
      ngIf: 'createSpace.spaceRatePlans'
    },
    [
      h('label', [h('strong', ['Rate Plan'])]),
      h('select.cfnext-select-box', {
        dataTestId: 'select-locale',
        ngModel: 'createSpace.newSpace.data.productRatePlanId',
        ngOptions: 'opt.id as opt.name for opt in createSpace.spaceRatePlans',
        ngDisabled: 'createSpace.createSpaceInProgress',
        ariaInvalid: '{{!!createSpace.newSpace.errors.fields.space_rate_plan}}'
      }),
      renderErrorLabel('createSpace.newSpace.errors.fields.space_rate_plan')
    ]
  );
}

function renderErrorLabel(expression) {
  return h('p.cfnext-form__field-error', { ngShow: expression }, [`{{${expression}}}`]);
}

function renderTemplateToggle() {
  return h('div.cfnext-form__field.create-new-space__form__radios', [
    h('div.cfnext-form-option.create-new-space__form__option', [
      h('input#newspace-template-none', {
        type: 'radio',
        id: 'newspace-template-none',
        name: 'useTemplate',
        ngValue: 'false',
        ngModel: 'createSpace.newSpace.useTemplate',
        ngDisabled: 'createSpace.createSpaceInProgress'
      }),
      h(
        'label',
        {
          for: 'newspace-template-none'
        },
        [
          h('strong', ['Create an empty space.']),
          h('span.create-new-space__form__label-description', [
            ' I’ll fill it with my own content.'
          ])
        ]
      )
    ]),
    h(
      'div.cfnext-form-option.create-new-space__form__option',
      {
        ngShow: 'createSpace.templates'
      },
      [
        h('input#newspace-template-usetemplate', {
          type: 'radio',
          id: 'newspace-template-usetemplate',
          name: 'useTemplate',
          ngValue: 'true',
          ngModel: 'createSpace.newSpace.useTemplate',
          ngDisabled: 'createSpace.createSpaceInProgress'
        }),
        h(
          'label',
          {
            for: 'newspace-template-usetemplate'
          },
          [
            h('strong', ['Create an example space.']),
            h('span.create-new-space__form__label-description', [
              ' I’d like to see how things work first.'
            ])
          ]
        )
      ]
    )
  ]);
}

function renderSpaceTemplates() {
  return h(
    'div.modal-dialog__slice.create-new-space__templates',
    {
      ngClass:
        "{'open': createSpace.newSpace.useTemplate && createSpace.templates.length, 'close': !createSpace.newSpace.useTemplate}"
    },
    [
      h('cf-icon', { name: 'arrow-up' }),
      h('div.create-new-space__templates__inner', [
        h(
          'div',
          {
            ngShow: '!createSpace.templates || !createSpace.templates.length',
            style: {
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }
          },
          [spinner({ diameter: '32px', style: { display: 'block' } })]
        ),
        h(
          'div',
          {
            ngShow: 'createSpace.templates && createSpace.templates.length'
          },
          [
            h('div.create-new-space__templates__nav', [
              h(
                'a.create-new-space__templates__navitem',
                {
                  ngRepeat: 'template in createSpace.templates',
                  ngClick: 'createSpace.selectTemplate(template)',
                  ngClass: '{selected: createSpace.newSpace.selectedTemplate === template}'
                },
                [
                  h('cf-icon.create-new-space__templates__navitem__icon', {
                    ngIf: 'template.svgName',
                    name: '{{template.svgName}}'
                  }),
                  '{{template.name}}'
                ]
              )
            ]),
            h(
              'div.create-new-space__templates__description',
              {
                ngShow: 'template === createSpace.newSpace.selectedTemplate',
                ngRepeat: 'template in createSpace.templates'
              },
              [
                h('img.create-new-space__templates__image', {
                  ngSrc: '{{template.image.fields.file.url}}'
                }),
                h('div.create-new-space__templates__text', [
                  h('div', {
                    ngBindHtml: 'template.descriptionV2'
                  })
                ])
              ]
            )
          ]
        )
      ])
    ]
  );
}

function renderCreateSpaceInProgress() {
  const infoItems = [
    {
      icon: 'page-ct',
      title: 'Content model',
      description:
        'The content model is comprised of content types, they work like a stencil which defines the structure of entries. We’re creating a few different content types for you to see how it works.'
    },
    {
      icon: 'page-content',
      title: 'Content',
      description:
        'Your content is made up of entries. The space will include a couple of entries based on the content types mentioned above.'
    },
    {
      icon: 'page-media',
      title: 'Media',
      description:
        'Your media consists of assets, which are external files, from images or videos to documents. Your entries will have a few assets to complement them.'
    },
    {
      icon: 'page-apis',
      title: 'API keys',
      description:
        'An API key is the token that you’ll use to retrieve your content. We created a few API keys so that you can get started fetching your content right away.'
    }
  ];

  return h(
    'div',
    {
      ngShow: "createSpace.viewState === 'creatingTemplate'"
    },
    [
      h('div.modal-dialog__content', [
        h('div.create-new-space__templates__status', [
          h('div.spinner', { ngShow: 'createSpace.createTemplateInProgress' }),
          h('cf-icon', {
            name: 'checkmark',
            scale: '2',
            ngShow: '!createSpace.createTemplateInProgress'
          })
        ]),
        h('h2.create-new-space-dialog__heading', ['Hang on, we’re preparing your space']),
        h('p.create-new-space-dialog__subheading', [
          'In the meantime, let us quickly explain the kind of things you’ll find in your space'
        ]),
        h('div.create-new-space__templates__entities', infoItems.map(renderInfoItem))
      ]),
      h('div.modal-dialog__controls.create-new-space-dialog__controls--centered', [
        h(
          'button.btn-action',
          {
            dataTestId: 'get-started',
            ngDisabled: 'createSpace.createTemplateInProgress',
            ngClick: 'dialog.confirm()'
          },
          ['Get started']
        )
      ])
    ]
  );
}

function renderInfoItem({ icon, title, description }) {
  return h('div.create-new-space__templates__entity', [
    h('cf-icon', { name: icon }),
    h('div.create-new-space__templates__entity__description', [
      h('h3', [title]),
      h('p', [description])
    ])
  ]);
}
