import React from 'react';
import { Select, Option } from '@contentful/forma-36-react-components';
import { FieldConnector } from '@contentful/field-editor-shared';
import PropTypes from 'prop-types';
import EditorWarningPredefinedValues from 'app/widgets/EditorWarningPredefinedValues.es6';
import { getOptions } from 'app/widgets/selectionController.es6';

const formatValue = (value, fieldType) => {
  if (fieldType === 'Integer') {
    return parseInt(value, 10);
  }
  if (fieldType === 'Number') {
    return parseFloat(value);
  }
  return value;
};

export default function DropdownEditor(props) {
  const field = props.field;

  const options = getOptions(field);
  const misconfigured = options.length === 0;
  const isDirected = ['Text', 'Symbol'].includes(field.type);

  if (misconfigured) {
    return <EditorWarningPredefinedValues data-test-id="predefined-values-warning" />;
  }

  return (
    <FieldConnector field={field} initialDisabled={props.initialDisabled}>
      {({ value, errors, disabled, setValue }) => {
        return (
          <Select
            testId="dropdown-editor"
            hasError={errors.length > 0}
            disabled={disabled}
            className={isDirected ? 'x--directed' : ''}
            required={field.required}
            value={(value || '').toString()}
            onChange={e => {
              const value = e.target.value;
              if (value === '') {
                setValue(undefined);
              } else {
                setValue(formatValue(value, field.type));
              }
            }}>
            <Option value="">Choose a value</Option>
            {options.map(option => (
              <Option key={option.value} value={option.value.toString()}>
                {option.label}
              </Option>
            ))}
          </Select>
        );
      }}
    </FieldConnector>
  );
}

DropdownEditor.propTypes = {
  field: PropTypes.object.isRequired,
  initialDisabled: PropTypes.bool.isRequired
};

DropdownEditor.defaultProps = {
  initialDisabled: true
};
