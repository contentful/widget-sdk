import * as Config from 'Config.es6';
import React from 'react';
import { h } from 'ui/Framework';
import { hbox, vspace, hspace } from 'ui/Layout.es6';
import { LinkOpen } from 'ui/Content.es6';

export default function render({
  serverFailure,
  fields,
  inProgress,
  SetFieldValue,
  CancelDialog,
  Submit
}) {
  return h(
    'div',
    {
      dataTestId: 'spaceEnvironmentsEditDialog'
    },
    [
      h('header.modal-dialog__header', [
        h('h1', ['Add environment']),
        h('button.modal-dialog__close', {
          onClick: () => CancelDialog()
        })
      ]),
      h(
        '.modal-dialog__content',
        {
          style: { paddingBottom: '30px' }
        },
        [
          serverFailure
            ? displayServerError({ inProgress, CancelDialog, Submit })
            : form({
                fields,
                inProgress,
                Submit,
                SetFieldValue,
                CancelDialog
              })
        ]
      )
    ]
  );
}

function form({ inProgress, fields, Submit, SetFieldValue, CancelDialog }) {
  return h(
    'form',
    {
      onSubmit: ev => {
        ev.preventDefault();
        Submit();
      }
    },
    [
      formField({
        label: 'ID',
        labelHint: '(required)',
        field: fields.id,
        input: {
          dataTestId: 'field.id',
          type: 'text',
          maxLength: '64'
        },
        hint: ['How the environment is referred to in the API.'],
        SetFieldValue
      }),

      dialogActions({
        submitLabel: 'Add environment',
        inProgress,
        CancelDialog
      })
    ]
  );
}

function formField({ label, labelHint, field, input, hint, SetFieldValue }) {
  return h('.cfnext-form__field', [
    h('label', [
      h('span', { style: { fontWeight: 'bold' } }, [label]),
      h('span.cfnext-form__label-hint', [labelHint])
    ]),
    h(
      'input.cfnext-form__input',
      Object.assign(
        {
          name: `field.${field.name}`,
          value: field.value || '',
          onChange: ev => SetFieldValue({ name: field.name, value: ev.target.value }),
          ariaInvalid: field.errors.length ? 'true' : undefined,
          autoComplete: 'off',
          style: { width: '100%' }
        },
        input
      )
    ),
    ...field.errors.map(error => {
      return h('p.cfnext-form__field-error', [error.message]);
    }),
    hint && h('p.cfnext-form__hint', hint)
  ]);
}

function displayServerError({ inProgress, CancelDialog, Submit }) {
  return h('div', [
    h('.note-box--warning', { role: 'alert' }, [
      h('h3', ['Whoops! something went wrong']),
      h('p', [
        `The creation of the environment has failed, probably due to a
        connection error. Please retry or `,
        <LinkOpen key="contact-support-link" url={Config.supportUrl}>
          contact support
        </LinkOpen>,
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

function dialogActions({ submitLabel, inProgress, CancelDialog, Submit }) {
  return hbox([
    h(
      'button.btn-primary-action',
      {
        class: inProgress && 'is-loading',
        disabled: inProgress,
        onClick: Submit && (() => Submit()),
        dataTestId: 'submit'
      },
      [submitLabel]
    ),
    hspace('10px'),
    h(
      'button.btn-secondary-action',
      {
        type: 'button',
        onClick: () => CancelDialog(),
        dataTestId: 'cancel'
      },
      ['Cancel']
    )
  ]);
}
