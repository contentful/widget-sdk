import React from 'react';
import PropTypes from 'prop-types';
import CodeMirror from 'react-codemirror';
import {get} from 'lodash';
import {byName as Colors} from 'Styles/Colors';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';

import {FIELD_TYPES} from './FieldTypes';

const EXTENSION_URL_RE = /(^https:\/\/)|(^http:\/\/localhost(:[0-9]+)?(\/|$))/;

const Label = ({text, info}) => {
  return <label>
    <span style={{fontWeight: 'bold'}}>{text}</span>
    {info && <span style={{color: Colors.textLight}}> ({info})</span>}
  </label>;
};

const Editor = ({height, value, onChange, options}) => {
  return <div style={{border: '1px solid #ddd', borderRadius: '4px'}}>
    <CodeMirror
      ref={el => el && el.getCodeMirror().setSize(null, height || '400px')}
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
      values={entity.parameters}
      missing={WidgetParametersUtils.markMissingValues(definitions, entity.parameters)}
      updateValue={(id, value) => {
        const updated = {...entity.parameters, [id]: value};
        onChange(WidgetParametersUtils.filterValues(definitions, updated));
      }}
    />}

    <div className="cfnext-form__field">
      <Label text={'Paramter definitions'} info={'read only'} />
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

  return <div style={{maxWidth: '80%'}}>
    <div className="cfnext-form__field">
      <Label text={'Name'} info={'required'} />
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
      <Label text={'Field types'} info={'required'} />
      <div style={{display: 'flex'}}>
        {FIELD_TYPES.map(type => {
          return <label key={type} style={{marginRight: '10px'}}>
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
      <Label text={'Hosting'} info={'required'} />
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
      <Label text={'Self-hosted URL'} info={'required'} />
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
      <Label text={'Code'} info={'required'} />
      <p>Maximum accepted code size is 200KB. For a larger size use the self-hosted option.</p>
      <Editor
        height={'700px'}
        value={entity.extension.srcdoc}
        onChange={value => updateExtensionProp('srcdoc', value)}
        options={{mode: 'htmlmixed', lineNumbers: true, tabSize: 2}}
      />
    </div>}

    <ExtensionParameters
      entity={entity}
      onChange={values => updateEntity({...entity, parameters: values})}
    />
  </div>;
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
