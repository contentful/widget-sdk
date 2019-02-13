import React from 'react';
import PropTypes from 'prop-types';
import { get } from 'lodash';
import { TextField, SelectField, Option } from '@contentful/forma-36-react-components';
import { byName as Colors } from 'Styles/Colors.es6';

const handleStringChange = (onChange, e) => {
  const { value } = e.target;
  const isNonEmptyString = typeof value === 'string' && value.length > 0;
  onChange(isNonEmptyString ? value : undefined);
};

const stringValue = value => (typeof value === 'number' ? `${value}` : value || '');

const NumberControl = ({ definition, value, onChange }) => {
  return (
    <input
      name={definition.id}
      className="cfnext-form__input--full-size"
      type="number"
      value={stringValue(value)}
      onChange={e => {
        const parsed = parseInt(e.target.value, 10);
        onChange(isNaN(parsed) ? undefined : parsed);
      }}
    />
  );
};

const BooleanOption = ({ name, value, option, onChange, label, style }) => {
  return (
    <div className="cfnext-form-option" style={style || {}}>
      <label>
        <input
          name={name || ''}
          type="checkbox"
          checked={value === option}
          onChange={() => onChange(value === option ? undefined : option)}
        />{' '}
        {label}
      </label>
    </div>
  );
};

const BooleanControl = ({ definition, value, onChange }) => {
  return (
    <fieldset className="cfnext-form__fieldset">
      <BooleanOption
        name={definition.id}
        value={value}
        option={true}
        onChange={onChange}
        label={get(definition, ['labels', 'true']) || 'Yes'}
        style={{ marginBottom: '4px' }}
      />
      <BooleanOption
        value={value}
        option={false}
        onChange={onChange}
        label={get(definition, ['labels', 'false']) || 'No'}
        style={{ marginBottom: '0' }}
      />
    </fieldset>
  );
};

const WidgetParameterControl = ({ definition, value, isMissing, onChange }) => {
  const { type, name, description, required } = definition;

  if (type === 'Symbol') {
    return (
      <TextField
        name={definition.id}
        id={definition.id}
        labelText={name}
        countCharacters
        textInputProps={{
          type: 'text',
          maxLength: 255
        }}
        required={required}
        helpText={description}
        value={stringValue(value)}
        onChange={handleStringChange.bind(null, onChange)}
        validationMessage={isMissing ? 'This value is required.' : ''}
        extraClassNames="f36-margin-bottom--l"
      />
    );
  }

  if (type == 'Enum') {
    return (
      <SelectField
        name={definition.id}
        id={definition.id}
        labelText={name}
        required={required}
        helpText={description}
        value={value}
        selectProps={{ isDisabled: false, width: 'medium' }}
        onChange={handleStringChange.bind(null, onChange)}
        validationMessage={isMissing ? 'This value is required.' : ''}
        extraClassNames="f36-margin-bottom--l">
        <Option value="">{get(definition, ['labels', 'empty']) || 'Select an option'}</Option>
        {definition.options.map(o => {
          const value = Object.keys(o)[0];
          return (
            <Option key={value} value={value}>
              {o[value]}
            </Option>
          );
        })}
      </SelectField>
    );
  }

  const Control = {
    Number: NumberControl,
    Boolean: BooleanControl
  }[type];

  return (
    <div className="cfnext-form__field">
      <label style={{ marginBottom: '2px' }}>
        <strong>{name}</strong>{' '}
        {required && <span style={{ color: Colors.textLight }}>(required)</span>}
      </label>
      {description && <p style={{ color: Colors.textMid }}>{description}</p>}
      <Control definition={definition} value={value} onChange={onChange} />
      {isMissing && <p className="cfnext-form__field-error">This value is required.</p>}
    </div>
  );
};

const WidgetParametersForm = ({ definitions, values, missing, updateValue }) => {
  return (
    <React.Fragment>
      {definitions.map(definition => {
        return (
          <WidgetParameterControl
            key={definition.id}
            definition={definition}
            value={values[definition.id]}
            isMissing={!!missing[definition.id]}
            onChange={updateValue.bind(null, definition.id)}
          />
        );
      })}
    </React.Fragment>
  );
};

const controlPropTypes = {
  definition: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  onChange: PropTypes.func.isRequired
};

NumberControl.propTypes = controlPropTypes;
BooleanControl.propTypes = controlPropTypes;

BooleanOption.propTypes = {
  name: PropTypes.string,
  value: PropTypes.bool,
  option: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
  style: PropTypes.object
};

WidgetParameterControl.propTypes = {
  ...controlPropTypes,
  isMissing: PropTypes.bool.isRequired
};

WidgetParametersForm.propTypes = {
  definitions: PropTypes.array.isRequired,
  values: PropTypes.object.isRequired,
  missing: PropTypes.object.isRequired,
  updateValue: PropTypes.func.isRequired
};

WidgetParametersForm.defaultProps = {
  definitions: []
};

export default WidgetParametersForm;
