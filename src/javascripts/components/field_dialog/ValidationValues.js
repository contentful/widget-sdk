import React, { useState, useEffect } from 'react';
import { noop, isInteger, includes } from 'lodash';
import PropTypes from 'prop-types';
import { css } from 'emotion';
import tokens from '@contentful/forma-36-tokens';
import KnowledgeBase from 'components/shared/knowledge_base_icon/KnowledgeBase';
import KEYCODES from 'utils/keycodes';
import {
  TextInput,
  ValidationMessage,
  Pill,
  TextField,
} from '@contentful/forma-36-react-components';
import { normalizeWhiteSpace } from 'utils/StringUtils';
import { sortableContainer, sortableElement } from 'react-sortable-hoc';
import arraySwap from 'utils/arraySwap';

const styles = {
  hint: css({
    marginBottom: tokens.spacingM,
    color: tokens.colorTextMid,
    fontSize: tokens.fontSizeM,
  }),
  container: css({
    marginTop: tokens.spacingM,
    marginBottom: tokens.spacingM,
    whiteSpace: 'nowrap',
    display: 'flex',
    flexWrap: 'wrap',
  }),
  pill: css({
    cursor: 'grab',
    userSelect: 'none',
    maxWidth: 200,
    marginBottom: tokens.spacingS,
    marginRight: tokens.spacingS,
  }),
};

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

export default function ValidationValues(props) {
  const [currentItems, setCurrentItems] = useState(props.items || []);
  const [textValue, setTextValue] = useState('');
  const [messageValue, setMessageValue] = useState(props.message || '');
  const [error, setError] = useState('');

  useEffect(() => {
    props.updateItems(currentItems);
  }, [currentItems, props]);

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
      value = parseValue(value, props.fieldType);
    } catch (e) {
      setError(e.message);
      return;
    }

    if (includes(currentItems, value)) {
      setError(ERROR_MESSAGES.duplicate);
      return;
    }

    setCurrentItems([...currentItems, value]);
    setError('');
    setTextValue('');
  };

  const onRemoveItem = (index) => {
    const items = [...currentItems];
    items.splice(index, 1);
    setCurrentItems(items);
  };

  const onSortEnd = ({ oldIndex, newIndex }) => {
    setCurrentItems(arraySwap(currentItems, oldIndex, newIndex));
  };

  return (
    <>
      {props.showPredefinedValueWidgetHint && <ValidationHint fieldType={props.fieldType} />}
      <TextInput
        className="f36-margin-bottom--xs"
        name="addPredefinedValue"
        id="addPredefinedValue"
        value={textValue}
        placeholder="Hit enter to add a value"
        onKeyDown={onKeyDownHandler}
        onChange={onChangeHandler}
      />
      {error && <ValidationMessage className="f36-margin-bottom--s">{error}</ValidationMessage>}

      {currentItems.length > 0 && (
        <SortablePills distance={10} onSortEnd={onSortEnd} axis="xy">
          {currentItems.map((value, index) => {
            return (
              <SortablePill
                value={value}
                index={index}
                key={value + index}
                onRemoveItem={onRemoveItem}
              />
            );
          })}
        </SortablePills>
      )}

      <TextField
        className="f36-margin-top--l"
        id="customErrorMessage"
        name="customErrorMessage"
        labelText="Custom error message"
        value={messageValue}
        onChange={(e) => {
          setMessageValue(e.target.value);
        }}
        onBlur={() => {
          props.updateMessage(messageValue);
        }}
      />
    </>
  );
}

ValidationValues.propTypes = {
  showPredefinedValueWidgetHint: PropTypes.bool,
  fieldType: PropTypes.string.isRequired,
  items: PropTypes.array,
  message: PropTypes.string,
  updateItems: PropTypes.func.isRequired,
  updateMessage: PropTypes.func.isRequired,
};
