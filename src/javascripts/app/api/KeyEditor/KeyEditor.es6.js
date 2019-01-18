/* eslint-disable react/prop-types */
import React from 'react';
import { h } from 'ui/Framework/index.es6';
import { byName as Colors } from 'Styles/Colors.es6';
import { assign } from 'utils/Collections.es6';
import { DocsLink } from 'ui/Content.es6';
import renderEnvironmentSelector from './EnvironmentSelector.es6';
import CopyIcon from 'svg/CopyIcon.es6';
import copyToClipboard from 'utils/DomClipboardCopy.es6';
import TextInput from './TextInput.es6';

export default function({ data, initialValue, connect, trackCopy }) {
  update(initialValue);

  function update(model) {
    const component = renderForm({ data, model, update, trackCopy });
    connect(
      model,
      component
    );
  }
}

function renderForm({ data, model, update, trackCopy }) {
  return h('div', [
    h('h3.section-title', ['Access tokens']),

    h('div', [
      'To query and get content using the APIs, client applications ',
      'need to authenticate with both the Space ID and an access token.'
    ]),

    h('div.f36-margin-top--xl'),

    section(
      {
        title: 'Name',
        description: [
          'Can be platform or device specific names (i.e. marketing website, tablet, VR app)'
        ]
      },
      [input({ canEdit: data.canEdit, model, key: 'name', update })]
    ),

    section(
      {
        title: 'Description',
        description: ['You can provide an optional description for reference in the future']
      },
      [input({ canEdit: data.canEdit, model, key: 'description', update })]
    ),

    section({ title: 'Space ID' }, [
      inputWithCopy({ value: data.spaceId, name: 'space-id', track: () => trackCopy('space') })
    ]),

    section({ title: 'Content Delivery API - access token' }, [
      inputWithCopy({
        value: data.deliveryToken,
        name: 'delivery-token',
        track: () => trackCopy('cda')
      })
    ]),

    separator(),

    section(
      {
        title: 'Content Preview API - access token',
        description: [
          'Preview unpublished content using this API (i.e. content with “Draft” status). ',
          <DocsLink key="content-preview-link" text="Read more" target="content_preview" />
        ]
      },
      [
        inputWithCopy({
          value: data.previewToken,
          name: 'preview-token',
          track: () => trackCopy('cpa')
        })
      ]
    ),

    data.environmentsEnabled && separator(),
    data.environmentsEnabled &&
      section(
        {
          title: 'Environments',
          description: [
            'Select the environments this API key should have access to. At least one environment has to be selected.'
          ]
        },
        [
          renderEnvironmentSelector({
            canEdit: data.canEdit,
            isAdmin: data.isAdmin,
            spaceEnvironments: data.spaceEnvironments,
            envs: model.environments,
            updateEnvs: environments => update(assign(model, { environments }))
          })
        ]
      )
  ]);
}

function input({ canEdit, model, update, key }) {
  return (
    <TextInput
      className="cfnext-form__input--full-size"
      type="text"
      name={key}
      value={model[key]}
      onChange={e => update(assign(model, { [key]: e.target.value }))}
      disabled={!canEdit}
    />
  );
}

function inputWithCopy({ value, name, track }) {
  return h('.cfnext-form__input-group--full-size', [
    h('input.cfnext-form__input--full-size', {
      style: { cursor: 'pointer' },
      type: 'text',
      name,
      readOnly: true,
      value,
      onClick: e => {
        e.target.focus();
        e.target.select();
      }
    }),
    h(
      '.cfnext-form__icon-suffix.copy-to-clipboard.x--input-suffix',
      {
        onClick: () => {
          copyToClipboard(value);
          track();
        },
        style: { cursor: 'pointer', paddingTop: '3px' }
      },
      [h(CopyIcon)]
    )
  ]);
}

function section({ title, description }, content) {
  return h(
    'div',
    [h('h4.h-reset', [title]), description && h('div', description), h('div.f36-margin-top--l')]
      .concat(content)
      .concat([h('div.f36-margin-top--xl')])
  );
}

function separator() {
  return h('div', {
    style: {
      height: '1px',
      width: '100%',
      backgroundColor: Colors.elementMid,
      margin: '2.5em 0'
    }
  });
}
