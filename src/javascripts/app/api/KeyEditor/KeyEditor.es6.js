/* eslint "rulesdir/restrict-inline-styles": "warn" */
/* eslint-disable react/prop-types */
import React from 'react';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
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

const styles = {
  marginTop: css({
    marginTop: tokens.spacingL
  }),
  separatorStyle: css({
    height: '1px',
    width: tokens.contentWidthFull,
    backgroundColor: tokens.colorElementMid,
    margin: `${tokens.spacingXl} 0`
  })
};

function renderForm({ data, model, update, trackCopy }) {
  return (
    <div>
      <h3 className="section-title">Access tokens</h3>
      <div>
        To query and get content using the APIs, client applications need to authenticate with both
        the Space ID and an access token.
      </div>
      <div className={styles.marginTop} />
      <Input
        canEdit={data.canEdit}
        model={model}
        name="name"
        update={update}
        isRequired={true}
        label="Name"
        description="Can be platform or device specific names (i.e. marketing website, tablet, VR app)"
      />
      <div className={styles.marginTop} />
      <Input
        canEdit={data.canEdit}
        model={model}
        name="description"
        update={update}
        label="Description"
        description="You can provide an optional description for reference in the future"
      />
      <div className={styles.marginTop} />
      <InputWithCopy
        value={data.spaceId}
        name="space-id"
        label="Space ID"
        track={() => trackCopy('space')}
      />
      <div className={styles.marginTop} />
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
          title={data.spaceAliases.length ? 'Environments & Environment Aliases' : 'Environments'}
          description={
            data.spaceAliases.length
              ? 'Select the environments and aliases this API key should have access to. At least one environment or alias has to be selected.'
              : 'Select the environments this API key should have access to. At least one environment has to be selected.'
          }>
          <EnvironmentSelector
            {...{
              canEdit: data.canEdit,
              isAdmin: data.isAdmin,
              spaceEnvironments: data.spaceEnvironments,
              spaceAliases: data.spaceAliases,
              selectedEnvOrAlias: model.environments,
              updateEnvOrAlias: environments => update(assign(model, { environments }))
            }}
          />
        </Section>
      )}
      <div className={styles.marginTop} />
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
        hasError
          ? `This field needs to be between ${model[name].minLength} and ${model[name].maxLength -
              1} characters`
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
      <h3 className="h-reset">{title}</h3>
      {description && <div>{description}</div>}
      <div className={styles.marginTop} />
      {children}
    </div>
  );
}

function Separator() {
  return <div className={styles.separatorStyle} />;
}
