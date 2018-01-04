import * as Config from 'Config';
import { h } from 'ui/Framework';
import { hbox, vspace, hspace } from 'ui/Layout';
import { linkOpen } from 'ui/Content';


export default function render ({
  serverFailure,
  fields,
  inProgress,
  config,
  SetFieldValue,
  CancelDialog,
  Submit
}) {
  return h('div', {
    dataTestId: 'spaceEnvironmentsEditDialog'
  }, [
    h('header.modal-dialog__header', [
      h('h1', [config.dialogTitle]),
      h('button.modal-dialog__close', {
        onClick: () => CancelDialog()
      })
    ]),
    h('.modal-dialog__content', {
      style: {paddingBottom: '30px'}
    }, [
      serverFailure
        ? displayServerError({ inProgress, CancelDialog, Submit })
        : form({
          fields,
          inProgress,
          config,
          Submit,
          SetFieldValue,
          CancelDialog
        })
    ])
  ]);
}


function form ({
  inProgress,
  fields,
  config: {
    submitLabel,
    showIdField
  },
  Submit,
  SetFieldValue,
  CancelDialog
}) {
  return h('form', {
    onSubmit: (ev) => {
      ev.preventDefault();
      Submit();
    }
  }, [
    formField({
      label: 'Name',
      labelHint: '(required)',
      field: fields.name,
      input: {
        dataTestId: 'field.name',
        type: 'text',
        maxLength: '40'
      },
      hint: [ 'How the environment is referred to in the web app.' ],
      SetFieldValue
    }),
    showIdField && formField({
      label: 'ID',
      labelHint: '(required)',
      field: fields.id,
      input: {
        dataTestId: 'field.id',
        type: 'text',
        maxLength: '64'
      },
      hint: [ 'How the environment is referred to in the API.' ],
      SetFieldValue
    }),

    dialogActions({
      submitLabel,
      inProgress,
      CancelDialog
    })
  ]);
}


function formField ({ label, labelHint, field, input, hint, SetFieldValue }) {
  return h('.cfnext-form__field', [
    h('label', [
      h('span', { style: { fontWeight: 'bold' } }, [ label ]),
      h('span.cfnext-form__label-hint', [ labelHint ])
    ]),
    h('input.cfnext-form__input', Object.assign({
      name: `field.${field.name}`,
      value: field.value || '',
      onChange: (ev) => SetFieldValue({name: field.name, value: ev.target.value}),
      ariaInvalid: field.errors.length ? 'true' : undefined,
      autoComplete: 'off',
      style: { width: '100%' }
    }, input)),
    ...field.errors.map((error) => {
      return h('p.cfnext-form__field-error', [ error.message ]);
    }),
    hint && h('p.cfnext-form__hint', hint)
  ]);
}


function displayServerError ({ inProgress, CancelDialog, Submit }) {
  return h('div', [
    h('.note-box--warning', {
      role: 'alert',
      dataTestId: 'pat.create.tokenGenerationFailed'
    }, [
      h('h3', [ 'Whoops! something went wrong' ]),
      h('p', [
        `The creation of the token has failed, probably due to a
        connection error. Please retry or `,
        linkOpen(['contact support'], Config.supportUrl),
        ' if the problem persists.'
      ])
    ]),
    vspace(3),
    dialogActions({
      submitLabel: 'Retry',
      inProgress,
      CancelDialog,
      Submit
    })
  ]);
}


function dialogActions ({ submitLabel, inProgress, CancelDialog, Submit }) {
  return hbox([
    h('button.btn-primary-action', {
      class: inProgress && 'is-loading',
      disabled: inProgress,
      onClick: Submit && (() => Submit()),
      dataTestId: 'submit'
    }, [ submitLabel ]),
    hspace('10px'),
    h('button.btn-secondary-action', {
      type: 'button',
      onClick: () => CancelDialog(),
      dataTestId: 'cancel'
    }, ['Cancel'])
  ]);
}
