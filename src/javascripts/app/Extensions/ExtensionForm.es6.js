import React from 'react';
import PropTypes from 'prop-types';
import CodeMirror from 'react-codemirror';
import {get} from 'lodash';
import WidgetParametersForm from 'widgets/WidgetParametersForm';
import * as WidgetParametersUtils from 'widgets/WidgetParametersUtils';

import {FIELD_TYPES} from './FieldTypes';

const ExtensionParameters = ({entity, onChange}) => {
  const definitions = get(entity, ['extension', 'parameters', 'installation']) || [];

  return <React.Fragment>
    {definitions.length > 0 && <React.Fragment>
      <h2>Installation parameters</h2>
      <WidgetParametersForm
        definitions={definitions}
        values={entity.parameters}
        missing={WidgetParametersUtils.markMissingValues(definitions, entity.parameters)}
        updateValue={(id, value) => {
          const updated = {...entity.parameters, [id]: value};
          onChange(WidgetParametersUtils.filterValues(definitions, updated));
        }}
      />
    </React.Fragment>}

    <h2>Paramter definitions</h2>
    <CodeMirror
      value={JSON.stringify({
        instance: get(entity, ['extension', 'parameters', 'instance']) || [],
        installation: definitions
      }, null, 2)}
      options={{mode: 'javascript', lineNumbers: true, readOnly: 'nocursor'}}
    />
  </React.Fragment>;
};

const ExtensionForm = ({entity, selfHosted, updateEntity, setSelfHosted}) => {
  const updateExtensionProp = (prop, value) => {
    return updateEntity({...entity, extension: {...entity.extension, [prop]: value}});
  };

  return <React.Fragment>
    <h2>Name</h2>
    <input
      type="text"
      value={entity.extension.name || ''}
      onChange={e => updateExtensionProp('name', e.target.value)}
    />

    <h2>Field types</h2>
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
        {type}
      </label>;
    })}

    <h2>Hosting</h2>
    <label>
      <input type="radio" checked={selfHosted} onChange={() => setSelfHosted(true)} />
      Self-hosted (<code>src</code>)
    </label>

    <label>
      <input type="radio" checked={!selfHosted} onChange={() => setSelfHosted(false)} />
      Hosted by Contentful (<code>srcdoc</code>)
    </label>

    {selfHosted && <div>
      <h2>Self-hosted extension URL</h2>
      <input
        type="text"
        value={entity.extension.src || ''}
        onChange={e => updateExtensionProp('src', e.target.value)}
      />
    </div>}

    {!selfHosted && <div>
      <h2>Extension code</h2>
      <CodeMirror
        value={entity.extension.srcdoc || ''}
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
