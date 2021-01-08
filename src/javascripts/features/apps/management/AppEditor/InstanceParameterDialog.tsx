import {
  Button,
  CheckboxField,
  FormLabel,
  HelpText,
  IconButton,
  Modal,
  Option,
  RadioButtonField,
  SelectField,
  TextField,
  TextInput,
  TextLink,
  Tooltip,
} from '@contentful/forma-36-react-components';
import { Grid, GridItem } from '@contentful/forma-36-react-components';
import deepEqual from 'fast-deep-equal';
import { isEmpty, isEqual, toNumber, toString } from 'lodash';
import React, { ChangeEvent, ComponentType, useState } from 'react';
import { toIdentifier } from 'utils/StringUtils';
import { ConditionalValidationMessage } from './ConditionalValidationMessage';
import { PARAMETER_ID_REG_EXP, PARAMETER_TYPE_LABEL } from './constants';
import { styles } from './styles';
import { ParameterDefinition, ParameterType, ValidationError } from './types';

const defaultParameter: Record<ParameterType, Partial<ParameterDefinition>> = {
  Boolean: {
    default: true,
    labels: {
      true: undefined,
      false: undefined,
    },
    options: undefined,
  },
  Enum: {
    default: 0,
    options: ['', ''],
    labels: {
      empty: undefined,
    },
  },
  Number: {
    default: undefined,
    options: undefined,
    labels: undefined,
  },
  Symbol: {
    default: '',
    options: undefined,
    labels: undefined,
  },
};

const OPTIONS_LIMIT = 10;

const typeSpecificConfig: Record<ParameterType, ComponentType<TypeSpecificConfigProps>> = {
  Symbol: SymbolConfig,
  Boolean: BooleanConfig,
  Number: NumberConfig,
  Enum: EnumConfig,
};

interface Props {
  newParameter?: boolean;
  parameter: ParameterDefinition;
  onSave: (parameter: ParameterDefinition) => void;
  open: boolean;
  onClose: () => void;
  errors?: ValidationError[];
  errorPath: ValidationError['path'];
}

export function InstanceParameterDialog({
  newParameter = false,
  parameter,
  onSave,
  open,
  onClose,
  errors = [],
  errorPath,
}: Props) {
  return (
    <Modal isShown={open} onClose={onClose} size="large" allowHeightOverflow>
      {() => (
        <ModalContent
          newParameter={newParameter}
          parameter={parameter}
          onSave={onSave}
          onClose={onClose}
          errors={errors}
          errorPath={errorPath}
        />
      )}
    </Modal>
  );
}

interface ModalContentProps {
  newParameter: boolean;
  parameter: ParameterDefinition;
  onSave: (parameter: ParameterDefinition) => void;
  onClose: () => void;
  errors: ValidationError[];
  errorPath: ValidationError['path'];
}

function ModalContent({
  newParameter,
  parameter: initialParameter,
  onSave,
  onClose,
  errors: serverErrors,
  errorPath,
}: ModalContentProps) {
  const [parameter, setParameter] = useState<ParameterDefinition>({
    ...initialParameter,
    default: convertDefaultFromProps(initialParameter),
  });
  const TypeSpecificConfig = typeSpecificConfig[parameter.type];

  const [errors, setErrors] = useState(serverErrors);

  const clearErrorForField = (path: ValidationError['path']) => {
    setErrors(errors.filter((error) => !isEqual(error.path, path)));
  };

  const handleSave = () => {
    const parameterToSave = { ...parameter, default: convertDefaultForSave(parameter) };

    const validationErrors = validate(parameterToSave, errorPath);
    setErrors(validationErrors);

    if (validationErrors.length > 0) {
      return;
    }

    onSave(parameterToSave);
    onClose();
  };

  const isDirty = !deepEqual(parameter, initialParameter);

  return (
    <>
      <Modal.Header
        title={newParameter ? 'Add parameter definition' : 'Edit parameter definition'}
      />
      <Modal.Content>
        <Grid columns="1fr 1fr" columnGap="spacingM" rowGap="spacingM">
          <TextField
            id="instance-parameter-name"
            name="instance-parameter-name"
            labelText="Display name"
            required
            value={parameter.name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setParameter({
                ...parameter,
                name: e.target.value,
                id:
                  toIdentifier(parameter.name) === parameter.id
                    ? toIdentifier(e.target.value)
                    : parameter.id,
              });
              clearErrorForField([...errorPath, 'name']);
            }}
            validationMessage={errors.find((e) => isEqual(e.path, [...errorPath, 'name']))?.details}
          />
          <TextField
            id="instance-parameter-id"
            name="instance-parameter-id"
            labelText="ID"
            required
            value={parameter.id}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setParameter({ ...parameter, id: e.target.value });
              clearErrorForField([...errorPath, 'id']);
            }}
            validationMessage={errors.find((e) => isEqual(e.path, [...errorPath, 'id']))?.details}
          />

          <GridItem columnStart={1} columnEnd={3}>
            <CheckboxField
              id="instance-parameter-required"
              labelText="Required parameter"
              helpText="You won't be able to assign this app if this parameter is empty"
              checked={parameter.required}
              className={styles.instanceParametersDialog.required}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setParameter({ ...parameter, required: e.target.checked });
              }}
            />
          </GridItem>

          <GridItem columnStart={1} columnEnd={3}>
            <TextField
              id="instance-parameter-description"
              name="instance-parameter-description"
              labelText="Description"
              helpText="Optionally, explain the purpose of this parameter."
              value={parameter.description}
              onChange={(e: ChangeEvent<HTMLInputElement>) => {
                setParameter({ ...parameter, description: e.target.value });
                clearErrorForField([...errorPath, 'description']);
              }}
              validationMessage={
                errors.find((e) => isEqual(e.path, [...errorPath, 'description']))?.details
              }
            />
          </GridItem>

          <GridItem columnStart={1} columnEnd={3}>
            <SelectField
              required
              id="instance-parameter-type"
              name="instance-parameter-type"
              labelText="Type"
              value={parameter.type}
              onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                setParameter({
                  ...parameter,
                  type: e.target.value as ParameterType,
                  ...defaultParameter[e.target.value],
                })
              }>
              {Object.entries(PARAMETER_TYPE_LABEL).map(([value, label]) => (
                <Option key={value} value={value}>
                  {label}
                </Option>
              ))}
            </SelectField>
          </GridItem>

          <TypeSpecificConfig
            parameter={parameter}
            onParameterChange={setParameter}
            errors={errors}
            errorPath={errorPath}
            clearErrorForField={clearErrorForField}
          />
        </Grid>
      </Modal.Content>

      <Modal.Controls>
        <Button buttonType="positive" onClick={handleSave} disabled={!isDirty}>
          Save
        </Button>
        <Button buttonType="muted" onClick={onClose}>
          Cancel
        </Button>
      </Modal.Controls>
    </>
  );
}

interface TypeSpecificConfigProps {
  parameter: ParameterDefinition;
  onParameterChange: (parameter: ParameterDefinition) => void;
  errors: ValidationError[];
  errorPath: ValidationError['path'];
  clearErrorForField: (path: ValidationError['path']) => void;
}

function SymbolConfig({
  parameter,
  onParameterChange,
  errors,
  errorPath,
  clearErrorForField,
}: TypeSpecificConfigProps) {
  return (
    <GridItem columnStart={1} columnEnd={3}>
      <TextField
        id="instance-parameter-default"
        name="instance-parameter-default"
        labelText="Default value"
        value={parameter.default as string | undefined}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onParameterChange({ ...parameter, default: e.target.value });
          clearErrorForField([...errorPath, 'default']);
        }}
        validationMessage={errors.find((e) => isEqual(e.path, [...errorPath, 'default']))?.details}
      />
    </GridItem>
  );
}

function BooleanConfig({
  parameter,
  onParameterChange,
  errors,
  errorPath,
  clearErrorForField,
}: TypeSpecificConfigProps) {
  return (
    <>
      <GridItem columnStart={1} columnEnd={3}>
        <FormLabel htmlFor="instance-parameter-default">Default value</FormLabel>
        <div
          id="instance-parameter-default"
          className={styles.instanceParametersDialog.booleanDefault}>
          <RadioButtonField
            id="instance-parameter-default-true"
            name="instance-parameter-default"
            labelText="True"
            checked={parameter.default === true}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              e.target.checked && onParameterChange({ ...parameter, default: true })
            }
            labelIsLight
          />
          <RadioButtonField
            id="instance-parameter-default-false"
            labelText="False"
            name="instance-parameter-default"
            checked={parameter.default === false}
            onChange={(e: ChangeEvent<HTMLInputElement>) =>
              e.target.checked && onParameterChange({ ...parameter, default: false })
            }
            labelIsLight
          />
        </div>
        <ConditionalValidationMessage errors={errors} path={[...errorPath, 'default']} />
      </GridItem>

      <TextField
        id="instance-parameter-label-tue"
        name="instance-parameter-label-tue"
        labelText="Custom label for True"
        textInputProps={{ placeholder: 'Yes' }}
        value={parameter.labels?.true ?? ''}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onParameterChange({
            ...parameter,
            labels: {
              ...parameter.labels,
              true: isEmpty(e.target.value) ? undefined : e.target.value,
            },
          });
          clearErrorForField([...errorPath, 'labels', 'true']);
        }}
        validationMessage={
          errors.find((e) => isEqual(e.path, [...errorPath, 'labels', 'true']))?.details
        }
      />
      <TextField
        id="instance-parameter-label-false"
        name="instance-parameter-label-false"
        labelText="Custom label for False"
        textInputProps={{ placeholder: 'No' }}
        value={parameter.labels?.false ?? ''}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onParameterChange({
            ...parameter,
            labels: {
              ...parameter.labels,
              false: isEmpty(e.target.value) ? undefined : e.target.value,
            },
          });
          clearErrorForField([...errorPath, 'labels', 'false']);
        }}
        validationMessage={
          errors.find((e) => isEqual(e.path, [...errorPath, 'labels', 'false']))?.details
        }
      />
    </>
  );
}

function NumberConfig({
  parameter,
  onParameterChange,
  errors,
  errorPath,
  clearErrorForField,
}: TypeSpecificConfigProps) {
  return (
    <GridItem columnStart={1} columnEnd={3}>
      <TextField
        id="instance-parameter-default"
        name="instance-parameter-default"
        labelText="Default value"
        textInputProps={{ type: 'number' }}
        value={toString(parameter.default as number | undefined)}
        onChange={(e: ChangeEvent<HTMLInputElement>) => {
          onParameterChange({
            ...parameter,
            default: isEmpty(e.target.value) ? undefined : toNumber(e.target.value),
          });
          clearErrorForField([...errorPath, 'default']);
        }}
        validationMessage={errors.find((e) => isEqual(e.path, [...errorPath, 'default']))?.details}
      />
    </GridItem>
  );
}

function EnumConfig({
  parameter,
  onParameterChange,
  errors,
  errorPath,
  clearErrorForField,
}: TypeSpecificConfigProps) {
  const options = (parameter.options ?? []).map((option) =>
    typeof option === 'string' ? { [option]: option } : option
  );

  return (
    <GridItem columnStart={1} columnEnd={3}>
      <FormLabel htmlFor="instance-parameter-options">Options</FormLabel>
      <HelpText>
        Edit the options of this <em>Select</em> parameter. The <em>Display text</em> is selectable
        within Contentful, you will receive the <em>Value</em> in your code.
      </HelpText>

      <table className={styles.enumOptions.table}>
        <tbody>
          {options
            .map((option) => Object.entries(option)[0])
            .map(([value, label], index) => (
              <tr key={index}>
                <td>
                  <TextInput
                    placeholder="Display text"
                    value={label}
                    onChange={(e) => {
                      onParameterChange({
                        ...parameter,
                        options: options.map((option, optionIndex) => {
                          if (optionIndex !== index) {
                            return option;
                          }

                          const newLabel = e.target.value;
                          const optionValue =
                            toIdentifier(label) === Object.keys(option)[0]
                              ? toIdentifier(newLabel)
                              : Object.keys(option)[0];

                          return {
                            [optionValue]: newLabel,
                          };
                        }),
                      });
                      clearErrorForField([...errorPath, 'options', index, 'label']);
                    }}
                    required
                  />
                  <ConditionalValidationMessage
                    errors={errors}
                    path={[...errorPath, 'options', index, 'label']}
                  />
                </td>
                <td>
                  <TextInput
                    placeholder="Value"
                    value={value}
                    onChange={(e) => {
                      onParameterChange({
                        ...parameter,
                        options: options.map((option, optionIndex) =>
                          optionIndex === index
                            ? { [e.target.value]: Object.values(option)[0] }
                            : option
                        ),
                      });
                      clearErrorForField([...errorPath, 'options', index, 'value']);
                    }}
                    required
                  />
                  <ConditionalValidationMessage
                    errors={errors}
                    path={[...errorPath, 'options', index, 'value']}
                  />
                </td>
                <td>
                  <RadioButtonField
                    labelText="Default"
                    id={`defaultOption[${index}]`}
                    name="defaultOption"
                    checked={index === parameter.default}
                    onChange={(e: ChangeEvent<HTMLInputElement>) =>
                      e.target.checked && onParameterChange({ ...parameter, default: index })
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
                        onParameterChange({
                          ...parameter,
                          options: options.filter((_, optionIndex) => optionIndex !== index),
                          default:
                            parameter.default === index
                              ? Math.max(0, index - 1)
                              : parameter.default,
                        });
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
          options.length >= OPTIONS_LIMIT && `You cannot add more than ${OPTIONS_LIMIT} options`
        }
        place="right">
        <TextLink
          icon="Plus"
          onClick={() => onParameterChange({ ...parameter, options: [...options, { '': '' }] })}
          disabled={options.length >= OPTIONS_LIMIT}>
          Add option
        </TextLink>
      </Tooltip>
    </GridItem>
  );
}

export function validate(
  parameter: ParameterDefinition,
  errorPath: ValidationError['path']
): ValidationError[] {
  const errors: ValidationError[] = [];

  if (isEmpty(parameter.id)) {
    errors.push({
      path: [...errorPath, 'id'],
      details: 'Please enter an ID',
    });
  } else if (!PARAMETER_ID_REG_EXP.test(parameter.id)) {
    errors.push({
      path: [...errorPath, 'id'],
      details: 'ID may not start with a number or _',
    });
  }

  if (isEmpty(parameter.name)) {
    errors.push({
      path: [...errorPath, 'name'],
      details: 'Please enter a name',
    });
  }

  // Check for empty fields
  const options = (parameter.options ?? []).map((option) =>
    typeof option === 'string'
      ? { value: option, label: option }
      : { value: Object.keys(option)[0], label: Object.values(option)[0] }
  );
  options.forEach(({ value, label }, optionIndex) => {
    if (isEmpty(value)) {
      errors.push({
        path: [...errorPath, 'options', optionIndex, 'value'],
        details: 'Please enter a value',
      });
    }

    if (isEmpty(label)) {
      errors.push({
        path: [...errorPath, 'options', optionIndex, 'label'],
        details: 'Please enter a display text',
      });
    }
  });

  // Check for unique values
  options.forEach(({ value }, optionIndex) => {
    if (options.find(({ value: v }, i) => v === value && optionIndex !== i)) {
      errors.push({
        path: [...errorPath, 'options', optionIndex, 'value'],
        details: 'Value must be unique',
      });
    }
  });

  return errors;
}

function convertDefaultFromProps(parameter: ParameterDefinition): ParameterDefinition['default'] {
  if (parameter.type !== 'Enum') {
    return parameter.default;
  }

  const index =
    parameter.options
      ?.map((option) => Object.keys(option)[0])
      .findIndex((option) => (typeof option === 'string' ? { [option]: option } : option)) ?? 0;
  return index === -1 ? 0 : index;
}

function convertDefaultForSave(parameter: ParameterDefinition): ParameterDefinition['default'] {
  if (parameter.type !== 'Enum') {
    return parameter.default;
  }

  const option = parameter.options?.[parameter.default as number] ?? {};
  return typeof option === 'string' ? option : Object.keys(option)[0];
}
