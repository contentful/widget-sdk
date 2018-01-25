import {h} from 'utils/hyperscript';

export default function () {
  return h('div.create-new-space-dialog.modal-dialog', [
    h('div.modal-dialog__header.create-new-space-dialog__header', [
      h('button.create-new-space-dialog__close.modal-dialog__close', {
        ngIf: "createSpace.viewState === 'createSpaceForm'",
        ngClick: 'dialog.cancel()'
      })
    ]),
    h('form', {
      ngShow: 'createSpace.viewState === "createSpaceForm"',
      ngSubmit: 'createSpace.requestSpaceCreation()',
      name: 'newSpaceForm'
    }, [
      h('div.create-new-space-dialog__content.modal-dialog__content', [
        h('div', {
          ngShow: 'createSpace.isOnboarding'
        }, [
          h('h2.create-new-space-dialog__heading', ['Let\'s create your first space now'])
        ]),
        h('div', {
          ngShow: '!createSpace.isOnboarding'
        }, [
          h('h2.create-new-space-dialog__heading', ['Create a new space'])
        ]),
        h('p.create-new-space-dialog__subheading', ['A space is a place where you keep all the content related to a single project.']),
        h('div.create-new-space__form', [
          h('div.create-new-space__fieldset', [
            h('div.cfnext-form__field', {
              ngHide: 'createSpace.writableOrganizations.length === 1'
            }, [
              h('label', [
                h('strong', ['Organization'])
              ]),
              h('select.cfnext-select-box', {
                dataTestId: 'select-organization',
                ngModel: 'createSpace.newSpace.organization',
                ngOptions: 'opt as opt.name for opt in createSpace.writableOrganizations',
                ngDisabled: 'createSpace.createSpaceInProgress',
                ariaInvalid: '{{!!createSpace.newSpace.errors.fields.organization}}'
              }),
              h('p.cfnext-form__field-error', {
                ngIf: 'createSpace.newSpace.errors.fields.organization'
              }, ['{{createSpace.newSpace.errors.fields.organization}}'])
            ]),
            h('div.cfnext-form__field', [
              h('label', {
                htmlFor: 'newspace-name'
              }, [
                h('strong', ['Space name'])
              ]),
              h('input#newspace-name.cfnext-form__input', {
                id: 'newspace-name',
                ngModel: 'createSpace.newSpace.data.name',
                ngRequired: 'required',
                cfFocusOnRender: 'cf-focus-on-render',
                type: 'text',
                ngDisabled: 'createSpace.createSpaceInProgress',
                ariaInvalid: '{{!!createSpace.newSpace.errors.fields.name}}'
              }),
              h('p.cfnext-form__field-error', {
                ngIf: 'createSpace.newSpace.errors.fields.name'
              }, ['{{createSpace.newSpace.errors.fields.name}}'])
            ]),
            h('div.cfnext-form__field', [
              h('label', [
                h('strong', ['Language'])
              ]),
              h('select.cfnext-select-box', {
                dataTestId: 'select-locale',
                ngModel: 'createSpace.newSpace.data.defaultLocale',
                ngOptions: 'opt.code as opt.displayName for opt in createSpace.localesList',
                ngDisabled: 'createSpace.createSpaceInProgress',
                ariaInvalid: '{{!!createSpace.newSpace.errors.fields.default_locale}}'
              }),
              h('p.cfnext-form__field-error', {
                ngIf: 'createSpace.newSpace.errors.fields.default_locale'
              }, ['{{createSpace.newSpace.errors.fields.default_locale}}'])
            ])
          ]),
          h('div.cfnext-form__field', {
            ngShow: 'createSpace.newSpace.errors.form'
          }, [
            h('div.cfnext-form__field-error', ['{{createSpace.newSpace.errors.form}}'])
          ]),
          h('div.cfnext-form__field.create-new-space__form__radios', [
            h('div.cfnext-form-option.create-new-space__form__option', [
              h('input#newspace-template-none', {
                type: 'radio',
                id: 'newspace-template-none',
                name: 'useTemplate',
                ngValue: 'false',
                ngModel: 'createSpace.newSpace.useTemplate',
                ngDisabled: 'createSpace.createSpaceInProgress'
              }),
              h('label', {
                htmlFor: 'newspace-template-none'
              }, [
                h('strong', ['Create an empty space.']),
                h('span.create-new-space__form__label-description', ['I\'ll fill it with my own content.'])
              ])
            ]),
            h('div.cfnext-form-option.create-new-space__form__option', {
              ngShow: 'createSpace.templates'
            }, [
              h('input#newspace-template-usetemplate', {
                type: 'radio',
                id: 'newspace-template-usetemplate',
                name: 'useTemplate',
                ngValue: 'true',
                ngModel: 'createSpace.newSpace.useTemplate',
                ngDisabled: 'createSpace.createSpaceInProgress'
              }),
              h('label', {
                htmlFor: 'newspace-template-usetemplate'
              }, [
                h('strong', ['Create an example space.']),
                h('span.create-new-space__form__label-description', ['I\'d like to see how things work first.'])
              ])
            ])
          ])
        ]),
        h('div.modal-dialog__slice.create-new-space__templates', {
          ngClass: "{'open': createSpace.newSpace.useTemplate && createSpace.templates.length}"
        }, [
          h('cf-icon', {
            name: 'arrow-up'
          }),
          h('div.create-new-space__templates__inner', [
            h('div', [
              h('div.create-new-space__templates__nav', [
                h('a.create-new-space__templates__navitem', {
                  ngRepeat: 'template in createSpace.templates',
                  ngClick: 'createSpace.selectTemplate(template)',
                  ngClass: '{selected: createSpace.newSpace.selectedTemplate === template}'
                }, [
                  h('cf-icon.create-new-space__templates__navitem__icon', {
                    ngIf: 'template.svgName',
                    name: '{{template.svgName}}'
                  }),
                  '{{template.name}}'
                ])
              ]),
              h('div.create-new-space__templates__description', {
                ngShow: 'template === createSpace.newSpace.selectedTemplate',
                ngRepeat: 'template in createSpace.templates'
              }, [
                h('img.create-new-space__templates__image', {
                  ngSrc: '{{template.image.fields.file.url}}'
                }),
                h('div.create-new-space__templates__text', [
                  h('div', {
                    ngBindHtml: 'template.descriptionV2'
                  })
                ])
              ])
            ])
          ])
        ])
      ]),
      h('div.modal-dialog__controls.create-new-space-dialog__controls--right', [
        h('button.btn-action', {
          ngClass: "{'is-loading': createSpace.createSpaceInProgress}",
          ngDisabled: 'createSpace.createSpaceInProgress',
          dataTestId: 'create-space'
        }, ['Create space'])
      ])
    ]),
    h('div', {
      ngShow: "createSpace.viewState === 'creatingTemplate'"
    }, [
      h('div.modal-dialog__content', [
        h('div.create-new-space__templates__status', [
          h('div.spinner', {
            ngShow: 'createSpace.createTemplateInProgress'
          }),
          h('cf-icon', {
            name: 'checkmark',
            scale: '2',
            ngShow: '!createSpace.createTemplateInProgress'
          })
        ]),
        h('h2.create-new-space-dialog__heading', ['Hang on, we\'re preparing your space']),
        h('p.create-new-space-dialog__subheading', ['In the meantime, let us quickly explain the kind of things you’ll find in your space']),
        h('div.create-new-space__templates__entities', [
          h('div.create-new-space__templates__entity', [
            h('cf-icon', {
              name: 'page-ct'
            }),
            h('div.create-new-space__templates__entity__description', [
              h('h3', ['Content model']),
              h('p', ['The content model is comprised of content types, they work like a stencil which defines the structure of entries. We’re creating a few different content types for you to see how it works.'])
            ])
          ]),
          h('div.create-new-space__templates__entity', [
            h('cf-icon', {
              name: 'page-content'
            }),
            h('div.create-new-space__templates__entity__description', [
              h('h3', ['Content']),
              h('p', ['Your content is made up of entries. The space will include a couple of entries based on the content types mentioned above.'])
            ])
          ]),
          h('div.create-new-space__templates__entity', [
            h('cf-icon', {
              name: 'page-media'
            }),
            h('div.create-new-space__templates__entity__description', [
              h('h3', ['Media']),
              h('p', ['Your media consists of assets, which are external files, from images or videos to documents. Your entries will have a few assets to complement them.'])
            ])
          ]),
          h('div.create-new-space__templates__entity', [
            h('cf-icon', {
              name: 'page-apis'
            }),
            h('div.create-new-space__templates__entity__description', [
              h('h3', ['API keys']),
              h('p', ['An API key is the token that you’ll use to retrieve your content. We created a few API keys so that you can get started fetching your content right away.'])
            ])
          ])
        ])
      ]),
      h('div.modal-dialog__controls.create-new-space-dialog__controls--centered', [
        h('button.btn-action', {
          dataTestId: 'get-started',
          ngDisabled: 'createSpace.createTemplateInProgress',
          ngClick: 'dialog.confirm()'
        }, ['Get started'])
      ])
    ])
  ]);
}
