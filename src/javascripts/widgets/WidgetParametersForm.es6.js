import React from 'react';
import PropTypes from 'prop-types';
import {get} from 'lodash';
import {byName as Colors} from 'Styles/Colors';

const handleStringChange = (onChange, e) => {
  const {value} = e.target;
  const isNonEmptyString = typeof value === 'string' && value.length > 0;
  onChange(isNonEmptyString ? value : undefined);
};

const stringValue = value => typeof value === 'number' ? `${value}` : (value || '');

const SymbolControl = ({definition, value, onChange}) => {
  return <input
    name={definition.id}
    className="cfnext-form__input--full-size"
    type="text"
    maxLength="255"
    value={stringValue(value)}
    onChange={handleStringChange.bind(null, onChange)}
  />;
};

const EnumControl = ({definition, value, onChange}) => {
  return <select
    name={definition.id}
    className="cfnext-select-box"
    value={stringValue(value)}
    onChange={handleStringChange.bind(null, onChange)}
  >
    <option key="" value="">{get(definition, ['labels', 'empty']) || 'Select an option'}</option>
    {definition.options.map(o => {
      const value = Object.keys(o)[0];
      return <option key={value} value={value}>{o[value]}</option>;
    })}
  </select>;
};

const NumberControl = ({definition, value, onChange}) => {
  return <input
    name={definition.id}
    className="cfnext-form__input--full-size"
    type="number"
    value={stringValue(value)}
    onChange={e => {
      const parsed = parseInt(e.target.value, 10);
      onChange(isNaN(parsed) ? undefined : parsed);
    }}
  />;
};

const BooleanOption = ({name, value, option, onChange, label, style}) => {
  return <div className="cfnext-form-option" style={style || {}}>
    <label>
      <input
        name={name || ''}
        type="checkbox"
        checked={value === option}
        onChange={() => onChange(value === option ? undefined : option)}
      />
      {' '}
      {label}
    </label>
  </div>;
};

const BooleanControl = ({definition, value, onChange}) => {
  return <fieldset className="cfnext-form__fieldset">
    <BooleanOption
      name={definition.id}
      value={value}
      option={true}
      onChange={onChange}
      label={get(definition, ['labels', 'true']) || 'Yes'}
      style={{marginBottom: '4px'}}
    />
    <BooleanOption
      value={value}
      option={false}
      onChange={onChange}
      label={get(definition, ['labels', 'false']) || 'No'}
      style={{marginBottom: '0'}}
    />
  </fieldset>;
};

const WidgetParameterControl = ({definition, value, isMissing, onChange}) => {
  const {type, name, description, required} = definition;
  const Control = {
    'Symbol': SymbolControl,
    'Enum': EnumControl,
    'Number': NumberControl,
    'Boolean': BooleanControl
  }[type];

  return <div className="cfnext-form__field">
    <label style={{marginBottom: '2px'}}>
      <strong>{name}</strong>
      {' '}
      {required && <span style={{color: Colors.textLight}}>(required)</span>}
    </label>
    {description && <p style={{color: Colors.textMid}}>{description}</p>}
    <Control definition={definition} value={value} onChange={onChange} />
    {isMissing && <p className="cfnext-form__field-error">This value is required.</p>}
  </div>;
};

const WidgetParametersForm = ({definitions, values, missing, updateValue}) => {
  return <React.Fragment>
    {definitions.map(definition => {
      return <WidgetParameterControl
        key={definition.id}
        definition={definition}
        value={values[definition.id]}
        isMissing={!!missing[definition.id]}
        onChange={updateValue.bind(null, definition.id)}
      />;
    })}
  </React.Fragment>;
};


const controlPropTypes = {
  definition: PropTypes.object.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number, PropTypes.bool]),
  onChange: PropTypes.func.isRequired
};

SymbolControl.propTypes = controlPropTypes;
EnumControl.propTypes = controlPropTypes;
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


export default WidgetParametersForm;
