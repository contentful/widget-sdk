/* eslint-disable react/prop-types */
import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { inRange } from 'lodash';
import { assign } from 'utils/Collections.es6';
import { DocsLink } from 'ui/Content.es6';
import EnvironmentSelector from './EnvironmentSelector.es6';
import { TextField } from '@contentful/forma-36-react-components';

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
  return (
    <div>
      <h3 className="section-title">Access tokens</h3>
      <div>
        To query and get content using the APIs, client applications need to authenticate with both
        the Space ID and an access token.
      </div>
      <div className="f36-margin-top--l" />
      <Input
        canEdit={data.canEdit}
        model={model}
        name="name"
        update={update}
        isRequired={true}
        label="Name"
        description="Can be platform or device specific names (i.e. marketing website, tablet, VR app)"
      />
      <div className="f36-margin-top--l" />
      <Input
        canEdit={data.canEdit}
        model={model}
        name="description"
        update={update}
        label="Description"
        description="You can provide an optional description for reference in the future"
      />
      <div className="f36-margin-top--l" />
      <InputWithCopy
        value={data.spaceId}
        name="space-id"
        label="Space ID"
        track={() => trackCopy('space')}
      />
      <div className="f36-margin-top--l" />
      <InputWithCopy
        key="content-delivery-api"
        value={data.deliveryToken}
        name="delivery-token"
        track={() => {
          trackCopy('cda');
        }}
        label="Content Delivery API - access token"
      />
      <Separator key="content-preview-api-separator" />
      <InputWithCopy
        key="content-preview-api"
        value={data.previewToken}
        name="preview-token"
        track={() => {
          trackCopy('cpa');
        }}
        label="Content Preview API - access token"
        description={
          <React.Fragment>
            Preview unpublished content using this API (i.e. content with “Draft” status).{' '}
            <DocsLink key="content-preview-link" text="Read more" target="content_preview" />
          </React.Fragment>
        }
      />
      {data.environmentsEnabled && <Separator />}
      {data.environmentsEnabled && (
        <Section
          title="Environments"
          description="Select the environments this API key should have access to. At least one environment has to be selected.">
          <EnvironmentSelector
            {...{
              canEdit: data.canEdit,
              isAdmin: data.isAdmin,
              spaceEnvironments: data.spaceEnvironments,
              envs: model.environments,
              updateEnvs: environments => update(assign(model, { environments }))
            }}
          />
        </Section>
      )}
      <div className="f36-margin-top--l" />
    </div>
  );
}

function Input({ canEdit, model, update, name, isRequired = false, label, description }) {
  const hasError = !inRange(model[name].value.length, model[name].minLength, model[name].maxLength);
  const textInputProps = {
    type: 'text',
    value: model[name].value,
    onChange: e => update(assign(model, { [name]: { ...model[name], value: e.target.value } })),
    disabled: !canEdit,
    error: hasError ? 'error' : undefined
  };
  const formLabelProps = isRequired
    ? {
        htmlFor: name
      }
    : {};

  return (
    <TextField
      id={name}
      name={name}
      labelText={label}
      helpText={description}
      required={isRequired}
      validationMessage={
        isRequired && hasError
          ? `This field needs to be between ${model[name].minLength} and ${model[name].maxLength} characters`
          : undefined
      }
      textInputProps={textInputProps}
      formLabelProps={formLabelProps}
    />
  );
}

function InputWithCopy({ value, name, track, label, description = '' }) {
  const textInputProps = {
    onCopy: track,
    withCopyButton: true,
    disabled: true
  };

  return (
    <TextField
      type="text"
      id={name}
      name={name}
      labelText={label}
      helpText={description}
      value={value}
      textInputProps={textInputProps}
    />
  );
}

function Section({ title, description, children }) {
  return (
    <div>
      <h4 className="h-reset">{title}</h4>
      {description && <div>{description}</div>}
      <div className="f36-margin-top--l" />
      {children}
    </div>
  );
}

function Separator() {
  return (
    <div
      style={{
        height: '1px',
        width: '100%',
        backgroundColor: tokens.colorElementMid,
        margin: '2.5em 0'
      }}
    />
  );
}
