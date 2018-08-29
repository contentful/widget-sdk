import React from 'react';
import PropTypes from 'prop-types';

import { FIELD_TYPES } from './FieldTypes';
import { Label, Editor, ExtensionParameters } from './ExtensionFormLeaves';

const EXTENSION_URL_RE = /(^https:\/\/)|(^http:\/\/localhost(:[0-9]+)?(\/|$))/;

const ExtensionForm = ({ entity, selfHosted, updateEntity, setSelfHosted }) => {
  const noName = (entity.extension.name || '').length < 1;
  const noFieldTypes = entity.extension.fieldTypes.length < 1;
  const invalidUrl = !EXTENSION_URL_RE.test(entity.extension.src || '');

  const updateExtensionProp = (prop, value) => {
    return updateEntity({ ...entity, extension: { ...entity.extension, [prop]: value } });
  };

  return (
    <React.Fragment>
      <div className="cfnext-form__field">
        <Label text="Name" info="required" />
        <input
          className="cfnext-form__input--full-size"
          type="text"
          value={entity.extension.name || ''}
          maxLength="255"
          onChange={e => {
            const value = e.target.value || '';
            updateExtensionProp('name', value.length > 0 ? value : undefined);
          }}
        />
        {noName && <p className="cfnext-form__field-error">This value is required.</p>}
      </div>

      <div className="cfnext-form__field">
        <Label text="Field types" info="required" />
        <div className="extension-form__field-types">
          {FIELD_TYPES.map(type => {
            return (
              <label key={type}>
                <input
                  type="checkbox"
                  checked={entity.extension.fieldTypes.includes(type)}
                  onChange={() => {
                    const cur = entity.extension.fieldTypes;
                    const next = cur.includes(type)
                      ? cur.filter(t => t !== type)
                      : cur.concat([type]);
                    updateExtensionProp('fieldTypes', next);
                  }}
                />
                {` ${type}`}
              </label>
            );
          })}
        </div>
        {noFieldTypes && (
          <p className="cfnext-form__field-error">At least one field type has to be selected.</p>
        )}
      </div>

      <div className="cfnext-form__field">
        <Label text="Hosting" info="required" />
        <label>
          <input type="radio" checked={selfHosted} onChange={() => setSelfHosted(true)} />{' '}
          Self-hosted (<code>src</code>)
        </label>

        <label>
          <input type="radio" checked={!selfHosted} onChange={() => setSelfHosted(false)} /> Hosted
          by Contentful (<code>srcdoc</code>)
        </label>
      </div>

      {selfHosted && (
        <div className="cfnext-form__field">
          <Label text="Self-hosted URL" info="required" />
          <input
            className="cfnext-form__input--full-size"
            type="text"
            value={entity.extension.src || ''}
            onChange={e => updateExtensionProp('src', e.target.value)}
          />
          {invalidUrl && (
            <p className="cfnext-form__field-error">
              Valid URLs use{' '}
              <code>
                https:
                {'//'}
              </code>
              . Only <code>localhost</code> can be used with{' '}
              <code>
                http:
                {'//'}
              </code>
              .
            </p>
          )}
        </div>
      )}

      {!selfHosted && (
        <div className="cfnext-form__field">
          <Label text="Code" info="required" />
          <p>Maximum accepted code size is 200KB. For a larger size use the self-hosted option.</p>
          <p>
            You can also develop your extensions locally. Learn about the{' '}
            <a
              href="https://github.com/contentful/extensions#managing-extensions"
              target="_blank"
              rel="noopener noreferrer">
              CLI based development flow
            </a>
            .
          </p>
          <Editor
            height="700px"
            value={entity.extension.srcdoc}
            onChange={value => updateExtensionProp('srcdoc', value)}
            options={{ mode: 'htmlmixed', lineNumbers: true, tabSize: 2 }}
          />
        </div>
      )}

      <div className="cfnext-form__field">
        <Label text="Render in sidebar" />
        <p>Hides the extension from the entry editor and instead renders it the sidebar.</p>
        <label>
          <input
            type="checkbox"
            checked={entity.extension.sidebar}
            onChange={() => updateExtensionProp('sidebar', !entity.extension.sidebar)}
          />{' '}
          Yes, render in the sidebar.
        </label>
      </div>

      <ExtensionParameters
        entity={entity}
        onChange={values => updateEntity({ ...entity, parameters: values })}
      />
    </React.Fragment>
  );
};

ExtensionForm.propTypes = {
  entity: PropTypes.object.isRequired,
  selfHosted: PropTypes.bool.isRequired,
  updateEntity: PropTypes.func.isRequired,
  setSelfHosted: PropTypes.func.isRequired
};

export default ExtensionForm;
