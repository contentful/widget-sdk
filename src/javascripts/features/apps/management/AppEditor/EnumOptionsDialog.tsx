import {
  Button,
  IconButton,
  Modal,
  Paragraph,
  RadioButtonField,
  TextInput,
  TextLink,
  Tooltip,
  ValidationMessage,
} from '@contentful/forma-36-react-components';
import deepEqual from 'fast-deep-equal';
import { isEmpty } from 'lodash';
import React, { ChangeEvent, Fragment, useState } from 'react';
import { ConditionalValidationMessage } from './ConditionalValidationMessage';
import { styles } from './styles';
import { ValidationError } from './types';
import { arrayStartsWith } from './util';

const OPTIONS_LIMIT = 10;

interface Props {
  defaultValue: string;
  options: { [value: string]: string };
  onChange: (options: { [value: string]: string }, defaultValue: string) => void;

  errorPath: ValidationError['path'];
  errors: ValidationError[];
  onErrorsChange: (errors: ValidationError[]) => void;

  disabled: boolean;
}

export function EnumOptionsDialog({
  defaultValue: initialDefaultValue,
  options: initialOptions,
  onChange,
  errorPath,
  errors: serverErrors = [],
  disabled,
}: Props) {
  const [options, setOptions] = useState<[string, string][]>(() =>
    Object.keys(initialOptions).length === 0
      ? [
          ['', ''],
          ['', ''],
        ]
      : Object.entries(initialOptions)
  );
  const [defaultIndex, setDefaultIndex] = useState(
    Math.max(
      options.findIndex(([value]) => value === initialDefaultValue),
      0
    )
  );
  const [isShown, setIsShown] = useState(false);

  const [errors, setErrors] = useState<ValidationError[]>(serverErrors);
  const handleSave = () => {
    const validationErrors = validate(options, errorPath);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    setIsShown(false);
    onChange(Object.fromEntries(options), options[defaultIndex][0]);
  };

  const handleClose = () => {
    setIsShown(false);
    setOptions(Object.entries(initialOptions));
  };

  const isDirty =
    !deepEqual(options, Object.entries(initialOptions)) ||
    options[defaultIndex]?.[0] !== initialDefaultValue;

  return (
    <Fragment>
      <TextLink onClick={() => setIsShown(true)} disabled={disabled}>
        Edit options
      </TextLink>
      {errors.find((error) => arrayStartsWith(error.path, errorPath)) && (
        <ValidationMessage>Invalid options</ValidationMessage>
      )}

      <Modal title="Edit options" isShown={isShown} onClose={handleClose} allowHeightOverflow>
        {() => (
          <form>
            <Modal.Header title="Edit options" onClose={handleClose} />
            <Modal.Content>
              <Paragraph className={styles.enumOptions.text}>
                Edit the options of this Select parameter. You will receive the ‘Value’ in your
                code, the ‘Display text’ is what you can select within Contentful.
              </Paragraph>

              <table className={styles.enumOptions.table}>
                <tbody>
                  {options.map(([value, label], index) => (
                    <tr key={index}>
                      <td>
                        <TextInput
                          placeholder="Display text"
                          value={label}
                          onChange={(e) =>
                            setOptions(
                              options.map(([value, label], optionIndex) => [
                                value,
                                index === optionIndex ? e.target.value : label,
                              ])
                            )
                          }
                          required
                        />
                        <ConditionalValidationMessage
                          errors={errors}
                          path={[...errorPath, index, 'label']}
                        />
                      </td>
                      <td>
                        <TextInput
                          placeholder="Value"
                          value={value}
                          onChange={(e) =>
                            setOptions(
                              options.map(([value, label], optionIndex) => [
                                index === optionIndex ? e.target.value : value,
                                label,
                              ])
                            )
                          }
                          required
                        />
                        <ConditionalValidationMessage
                          errors={errors}
                          path={[...errorPath, index, 'value']}
                        />
                      </td>
                      <td>
                        <RadioButtonField
                          labelText="Default"
                          id={`defaultOption[${index}]`}
                          name="defaultOption"
                          checked={defaultIndex === index}
                          onChange={(e: ChangeEvent<HTMLInputElement>) =>
                            e.target.checked && setDefaultIndex(index)
                          }
                        />
                      </td>
                      <td>
                        <Tooltip
                          content={options.length === 1 && `There must be at least one option`}
                          place="left">
                          <IconButton
                            label="Remove option"
                            iconProps={{ icon: 'Delete' }}
                            buttonType="muted"
                            disabled={options.length === 1}
                            onClick={() => {
                              setErrors([]);
                              setOptions(options.filter((_, optionIndex) => optionIndex !== index));
                              if (index <= defaultIndex) {
                                setDefaultIndex(Math.max(defaultIndex - 1, 0));
                              }
                            }}
                          />
                        </Tooltip>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Tooltip
                content={
                  options.length >= OPTIONS_LIMIT &&
                  `You cannot add more than ${OPTIONS_LIMIT} options`
                }
                place="right">
                <TextLink
                  icon="Plus"
                  onClick={() => setOptions([...options, ['', '']])}
                  disabled={options.length >= OPTIONS_LIMIT}>
                  Add option
                </TextLink>
              </Tooltip>
            </Modal.Content>

            <Modal.Controls>
              <Button buttonType="positive" onClick={handleSave} disabled={!isDirty}>
                Save
              </Button>
              <Button buttonType="muted" onClick={handleClose}>
                Cancel
              </Button>
            </Modal.Controls>
          </form>
        )}
      </Modal>
    </Fragment>
  );
}

function validate(
  options: ReadonlyArray<[string, string]>,
  errorPath: ValidationError['path']
): ValidationError[] {
  const errors: ValidationError[] = [];

  // Check for empty fields
  options.forEach(([value, label], optionIndex) => {
    if (isEmpty(value)) {
      errors.push({
        path: [...errorPath, optionIndex, 'value'],
        details: 'Please enter a value',
      });
    }

    if (isEmpty(label)) {
      errors.push({
        path: [...errorPath, optionIndex, 'label'],
        details: 'Please enter a display text',
      });
    }
  });

  // Check for unique values
  options.forEach(([value], optionIndex) => {
    if (options.find(([v], i) => v === value && optionIndex !== i)) {
      errors.push({
        path: [...errorPath, optionIndex, 'value'],
        details: 'Value must be unique',
      });
    }
  });

  return errors;
}
