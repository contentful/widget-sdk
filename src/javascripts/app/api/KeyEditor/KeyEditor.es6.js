/* eslint-disable react/prop-types */
import React from 'react';
import { byName as Colors } from 'Styles/Colors.es6';
import { assign } from 'utils/Collections.es6';
import { DocsLink } from 'ui/Content.es6';
import EnvironmentSelector from './EnvironmentSelector.es6';
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
  return (
    <div>
      <h3 className="section-title">Access tokens</h3>
      <div>
        To query and get content using the APIs, client applications need to authenticate with both
        the Space ID and an access token.
      </div>
      <div className="f36-margin-top--xl" />
      <Section
        title="Name"
        description="Can be platform or device specific names (i.e. marketing website, tablet, VR app)">
        <Input canEdit={data.canEdit} model={model} name="name" update={update} />
      </Section>
      <div className="f36-margin-top--xl" />
      <Section
        title="Description"
        description="You can provide an optional description for reference in the future">
        <Input canEdit={data.canEdit} model={model} name="description" update={update} />
      </Section>
      <div className="f36-margin-top--xl" />
      <Section title="Space ID">
        <InputWithCopy value={data.spaceId} name="space-id" track={() => trackCopy('space')} />
      </Section>
      <div className="f36-margin-top--xl" />
      <Section key="content-delivery-api" title="Content Delivery API - access token">
        <InputWithCopy
          value={data.deliveryToken}
          name="delivery-token"
          track={() => {
            trackCopy('cda');
          }}
        />
      </Section>
      <Separator key="content-preview-api-separator" />
      <Section
        key="content-preview-api"
        title="Content Preview API - access token"
        description={
          <React.Fragment>
            Preview unpublished content using this API (i.e. content with “Draft” status).
            <DocsLink key="content-preview-link" text="Read more" target="content_preview" />
          </React.Fragment>
        }>
        <InputWithCopy
          value={data.previewToken}
          name="preview-token"
          track={() => {
            trackCopy('cpa');
          }}
        />
      </Section>
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
      <div className="f36-margin-top--xl" />
    </div>
  );
}

function Input({ canEdit, model, update, name }) {
  return (
    <TextInput
      className="cfnext-form__input--full-size"
      type="text"
      name={name}
      value={model[name]}
      onChange={e => update(assign(model, { [name]: e.target.value }))}
      disabled={!canEdit}
    />
  );
}

function InputWithCopy({ value, name, track }) {
  return (
    <div className="cfnext-form__input-group--full-size">
      <input
        className="cfnext-form__input--full-size"
        type="text"
        name={name}
        readOnly
        value={value}
        style={{ cursor: 'pointer' }}
        onClick={e => {
          e.target.focus();
          e.target.select();
        }}
      />
      <div
        style={{ cursor: 'pointer', paddingTop: '3px' }}
        onClick={() => {
          copyToClipboard(value);
          track();
        }}
        className="cfnext-form__icon-suffix copy-to-clipboard x--input-suffix">
        <CopyIcon />
      </div>
    </div>
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
        backgroundColor: Colors.elementMid,
        margin: '2.5em 0'
      }}
    />
  );
}
