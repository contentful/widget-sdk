import React, { useState, useMemo } from 'react';
import { noop, isInteger, includes } from 'lodash';
import PropTypes from 'prop-types';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import KEYCODES from 'utils/keycodes';
import {
  TextInput,
  ValidationMessage,
  Pill,
  TextField,
  CheckboxField,
} from '@contentful/forma-36-react-components';
import { normalizeWhiteSpace } from 'utils/StringUtils';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import arraySwap from 'utils/arraySwap';
import { ValidationFieldType } from 'features/content-model-editor/field-dialog/utils/PropTypes';
import { toString, intersection } from 'lodash';
import { WidgetNamespace } from '@contentful/widget-renderer';
import { styles } from './styles';

// The maximum number of digits we can represent without rounding
// errors.
const MAX_PRECISION = 21;
const MAX_LENGTH = 85;

const ERROR_MESSAGES = {
  integerOutOfRange: 'Number is out of range.',
  numberOverflow: `Numbers should be ${MAX_PRECISION} characters long or less (use a text field otherwise).`,
  emptyValue: 'The input is empty. Please add some non-whitespace characters.',
  numberParsingFailed: 'You can only add number values.',
  numberNotAnInteger: 'You can only add integer values.',
  stringTooLong: `Values must be ${MAX_LENGTH} characters or less.`,
  duplicate: 'This value already exists on the list.',
};

function shouldShowPrefferedValueHint(namespace, id, availableWidgets) {
  const isBuiltin = namespace === WidgetNamespace.BUILTIN;
  const predefinedValueWidgetIds = ['radio', 'dropdown', 'checkbox'];
  const validWidgetSelected = isBuiltin && predefinedValueWidgetIds.includes(id);
  const availableWidgetIds = (availableWidgets || [])
    .filter(({ namespace }) => namespace === WidgetNamespace.BUILTIN)
    .map(({ id }) => id);
  const validWidgetAvailable =
    intersection(availableWidgetIds, predefinedValueWidgetIds).length > 0;
  return !validWidgetSelected && validWidgetAvailable;
}

function parseString(str) {
  const value = normalizeWhiteSpace(str);
  if (value.length > MAX_LENGTH) {
    throw new Error(ERROR_MESSAGES.stringTooLong);
  }

  if (!value) {
    throw new Error(ERROR_MESSAGES.emptyValue);
  }

  return value;
}

function parseNumber(value, type) {
  if (type === 'Number' && value.length > MAX_PRECISION) {
    throw new Error(ERROR_MESSAGES.numberOverflow);
  }

  value = value.replace(',', '.');
  value = parseFloat(value, 10);

  if (Number.isNaN(value)) {
    throw new Error(ERROR_MESSAGES.numberParsingFailed);
  }

  if (type === 'Integer') {
    if (!isInteger(value)) {
      throw new Error(ERROR_MESSAGES.numberNotAnInteger);
    }

    if (value > Number.MAX_SAFE_INTEGER || value < Number.MIN_SAFE_INTEGER) {
      throw new Error(ERROR_MESSAGES.integerOutOfRange);
    }
  }

  return value;
}

/**
 * Take a string and parse it into a number if the field type is
 * 'Integer' or 'Number'. Otherwise return the string as-is.
 *
 * The function throws errors if the value could not be parsed
 * correctly.
 */
function parseValue(value, type) {
  if (type === 'Number' || type === 'Integer') {
    return parseNumber(value, type);
  }
  return parseString(value);
}

function ValidationHint(props) {
  const isArrayFieldType = props.fieldType === 'Array';
  return (
    <div className={styles.hint}>
      {isArrayFieldType ? (
        <span>Predefined values work best with the checkbox editor.</span>
      ) : (
        <span>Predefined values work best with the dropdown list or radio button list.</span>
      )}
      <br />
      To select either, go to the “Appearance” tab.&#x20; Learn more about&#x20;{' '}
      <KnowledgeBase target="predefined_value" text="predefined values" inlineText />.
    </div>
  );
}

ValidationHint.propTypes = {
  fieldType: PropTypes.string.isRequired,
};

const SortablePills = sortableContainer(({ children }) => (
  <div className={styles.container}>{children}</div>
));

const SortablePill = sortableElement(({ value, index, onRemoveItem }) => (
  <Pill
    tabIndex={0}
    className={styles.pill}
    testId="validation-item"
    status="primary"
    label={value}
    onClose={() => {
      onRemoveItem(index);
    }}
    onDrag={noop}
  />
));

SortablePill.propTypes = {
  value: PropTypes.string.isRequired,
  index: PropTypes.number.isRequired,
  onRemoveItem: PropTypes.func.isRequired,
};

function ValidationValues({
  validation,
  onChange,
  onBlur,
  ctFieldType,
  widgetSettings,
  availableWidgets,
}) {
  const { name, helpText, type, message, settings: currentItems, enabled } = validation.value;
  const [textValue, setTextValue] = useState('');
  const [error, setError] = useState('');

  const showPrefferedValueHint = useMemo(
    () =>
      shouldShowPrefferedValueHint(widgetSettings.namespace, widgetSettings.id, availableWidgets),
    [widgetSettings, availableWidgets]
  );

  const onChangeItems = (settings) => onChange(type, { ...validation.value, settings });

  const onChangeHandler = (e) => {
    setTextValue(e.target.value);
    setError('');
  };

  const onKeyDownHandler = (e) => {
    let value = e.target.value;
    if (e.keyCode !== KEYCODES.ENTER || !value) {
      return;
    }
    try {
      value = parseValue(value, ctFieldType);
    } catch (e) {
      setError(e.message);
      return;
    }

    if (includes(currentItems, value)) {
      setError(ERROR_MESSAGES.duplicate);
      return;
    }
    const items = currentItems ? currentItems : [];
    onChangeItems([...items, value]);
    setError('');
    setTextValue('');
  };

  const onRemoveItem = (index) => {
    const items = [...currentItems];
    items.splice(index, 1);
    onChangeItems(items);
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    onChangeItems(arraySwap(currentItems, oldIndex, newIndex));
  };

  return (
    <div data-test-id={`field-validations--${type}`}>
      <CheckboxField
        className={styles.marginBottomS}
        labelText={name}
        helpText={helpText}
        id={`field-validations-checkbox--${type}`}
        checked={enabled}
        onChange={(e) =>
          onChange(type, {
            ...validation.value,
            enabled: e.target.checked,
          })
        }
      />
      {enabled && (
        <div>
          <div className={styles.validationValuesRow}>
            {showPrefferedValueHint && <ValidationHint fieldType={ctFieldType} />}
            <TextInput
              name="addPredefinedValue"
              id="addPredefinedValue"
              value={textValue}
              placeholder="Hit enter to add a value"
              onKeyDown={onKeyDownHandler}
              onChange={onChangeHandler}
            />
            {(error || validation.error) && (
              <ValidationMessage className={styles.validationMessage}>
                {error || validation.error}
              </ValidationMessage>
            )}

            {(currentItems && currentItems.length) > 0 && (
              <SortablePills distance={10} onSortEnd={onSortEnd} axis="xy">
                {currentItems.map((value, index) => {
                  return (
                    <SortablePill
                      value={value.toString()}
                      index={index}
                      key={value + index}
                      onRemoveItem={() => onRemoveItem(index)}
                    />
                  );
                })}
              </SortablePills>
            )}
          </div>

          <TextField
            className={styles.helpTextInput}
            id={`custom-error-message-${type}`}
            name="customErrorMessage"
            labelText="Custom error message"
            value={toString(message)}
            onChange={(e) => {
              onChange(type, { ...validation.value, message: e.target.value });
            }}
            onBlur={() => onBlur(type)}
          />
        </div>
      )}
    </div>
  );
}

ValidationValues.propTypes = {
  validation: PropTypes.shape(ValidationFieldType).isRequired,
  onChange: PropTypes.func.isRequired,
  onBlur: PropTypes.func.isRequired,
  ctFieldType: PropTypes.string.isRequired,
  widgetSettings: PropTypes.shape({
    namespace: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    params: PropTypes.object,
  }).isRequired,
  availableWidgets: PropTypes.array.isRequired,
};

export { ValidationValues };
