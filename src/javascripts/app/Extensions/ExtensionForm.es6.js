import React from 'react';
import PropTypes from 'prop-types';
import CodeMirror from 'react-codemirror';
import {get} from 'lodash';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';

import {FIELD_TYPES} from './FieldTypes';

const EXTENSION_URL_RE = /(^https:\/\/)|(^http:\/\/localhost(:[0-9]+)?(\/|$))/;
const DEFAULT_CM_HEIGHT = '400px';

const Label = ({text, info}) => {
  return <label>
    <span className="extension-form__label">{text}</span>
    {info && <span className="extension-form__label-info"> ({info})</span>}
  </label>;
};

const Editor = ({height, value, onChange, options}) => {
  return <div className={`extension-form__cm${options.readOnly ? ' x--readonly' : ''}`}>
    <CodeMirror
      ref={el => el && el.getCodeMirror().setSize(null, height || DEFAULT_CM_HEIGHT)}
      value={value || ''}
      onChange={onChange}
      options={options}
    />
  </div>;
};

const ExtensionParameters = ({entity, onChange}) => {
  const definitions = get(entity, ['extension', 'parameters', 'installation']) || [];

  return <React.Fragment>
    {definitions.length > 0 && <WidgetParametersForm
      definitions={definitions}
      values={entity.parameters || {}}
      missing={WidgetParametersUtils.markMissingValues(definitions, entity.parameters)}
      updateValue={(id, value) => {
        const updated = {...entity.parameters, [id]: value};
        onChange(WidgetParametersUtils.filterValues(definitions, updated));
      }}
    />}

    <div className="cfnext-form__field">
      <Label text="Paramter definitions" info="read only" />
      <p>
        You can set parameter definitions using the <a
          href="https://www.contentful.com/developers/docs/references/content-management-api/#/reference/ui-extensions/configuration-parameters"
          target="_blank"
          rel="noopener noreferrer"
        >
          Content Management API
        </a>.
      </p>
      <Editor
        value={JSON.stringify({
          instance: get(entity, ['extension', 'parameters', 'instance']) || [],
          installation: definitions
        }, null, 2)}
        options={{mode: 'javascript', lineNumbers: true, readOnly: 'nocursor'}}
      />
    </div>
  </React.Fragment>;
};

const ExtensionForm = ({entity, selfHosted, updateEntity, setSelfHosted}) => {
  const updateExtensionProp = (prop, value) => {
    return updateEntity({...entity, extension: {...entity.extension, [prop]: value}});
  };

  return <React.Fragment>
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
      {(entity.extension.name || '').length < 1 && <p className="cfnext-form__field-error">
        This value is required.
      </p>}
    </div>

    <div className="cfnext-form__field">
      <Label text="Field types" info="required" />
      <div className="extension-form__field-types">
        {FIELD_TYPES.map(type => {
          return <label key={type}>
            <input
              type="checkbox"
              checked={entity.extension.fieldTypes.includes(type)}
              onChange={() => {
                const cur = entity.extension.fieldTypes;
                const next = cur.includes(type) ? cur.filter(t => t !== type) : cur.concat([type]);
                updateExtensionProp('fieldTypes', next);
              }}
            />
            {` ${type}`}
          </label>;
        })}
      </div>
      {entity.extension.fieldTypes.length < 1 && <p className="cfnext-form__field-error">
        At least one field type has to be selected.
      </p>}
    </div>

    <div className="cfnext-form__field">
      <Label text="Hosting" info="required" />
      <label>
        <input type="radio" checked={selfHosted} onChange={() => setSelfHosted(true)} />
        {' '}Self-hosted (<code>src</code>)
      </label>

      <label>
        <input type="radio" checked={!selfHosted} onChange={() => setSelfHosted(false)} />
        {' '}Hosted by Contentful (<code>srcdoc</code>)
      </label>
    </div>

    {selfHosted && <div className="cfnext-form__field">
      <Label text="Self-hosted URL" info="required" />
      <input
        className="cfnext-form__input--full-size"
        type="text"
        value={entity.extension.src || ''}
        onChange={e => updateExtensionProp('src', e.target.value)}
      />
      {!EXTENSION_URL_RE.test(entity.extension.src || '') && <p className="cfnext-form__field-error">
        Valid URLs use <code>https:{'//'}</code>. Only <code>localhost</code> can be used with <code>http:{'//'}</code>.
      </p>}
    </div>}

    {!selfHosted && <div className="cfnext-form__field">
      <Label text="Code" info="required" />
      <p>Maximum accepted code size is 200KB. For a larger size use the self-hosted option.</p>
      <Editor
        height="700px"
        value={entity.extension.srcdoc}
        onChange={value => updateExtensionProp('srcdoc', value)}
        options={{mode: 'htmlmixed', lineNumbers: true, tabSize: 2}}
      />
    </div>}

    <ExtensionParameters
      entity={entity}
      onChange={values => updateEntity({...entity, parameters: values})}
    />
  </React.Fragment>;
};


Editor.propTypes = {
  height: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  options: PropTypes.object.isRequired
};

Label.propTypes = {
  text: PropTypes.string.isRequired,
  info: PropTypes.string
};

ExtensionParameters.propTypes = {
  entity: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired
};

ExtensionForm.propTypes = {
  entity: PropTypes.object.isRequired,
  selfHosted: PropTypes.bool.isRequired,
  updateEntity: PropTypes.func.isRequired,
  setSelfHosted: PropTypes.func.isRequired
};

export default ExtensionForm;
