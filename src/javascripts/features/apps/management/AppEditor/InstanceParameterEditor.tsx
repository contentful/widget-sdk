import {
  Button,
  FormLabel,
  HelpText,
  IconButton,
  Note,
  Option,
  Select,
  TextInput,
  Tooltip,
} from '@contentful/forma-36-react-components';
import c from 'classnames';
import { NewTag } from 'components/shared/NewTag';
import { isEmpty, isEqual, noop, toNumber, toString } from 'lodash';
import React, { ChangeEvent } from 'react';
import { ConditionalValidationMessage } from './ConditionalValidationMessage';
import { PARAMETER_ID_REG_EXP } from './constants';
import { EnumOptionsDialog } from './EnumOptionsDialog';
import { styles } from './styles';
import { ValidationError } from './types';
import { arrayStartsWith } from './util';

const PARAM_LIMIT = 8;

const DEFAULT_PARAMETER: ParameterDefinition = {
  id: '',
  name: '',
  type: 'Symbol',
  default: '',
};

const DEFAULT_DEFAULT_VALUES = {
  Symbol: '',
  Number: undefined,
  Boolean: false,
  Enum: 0,
};

interface ParameterDefinition {
  id: string;
  name: string;
  type: 'Symbol' | 'Number' | 'Boolean' | 'Enum';
  default?: string | boolean | number;
  options?: Array<string | Record<string, string>>;
}

interface Props {
  parameters: ParameterDefinition[];
  onChange: (parameters: ParameterDefinition[]) => void;
  errors: ValidationError[];
  onErrorsChange: (errors: ValidationError[]) => void;
  disabled: boolean;
}

export function InstanceParameterEditor({
  parameters,
  onChange,
  errors = [],
  onErrorsChange = noop,
  disabled,
}: Props) {
  const clearErrorForField = (path: ValidationError['path']) => {
    onErrorsChange(errors.filter((error) => !isEqual(error.path, path)));
  };

  const handleChange = (paramIndex: number, parameter: ParameterDefinition) => {
    onChange(parameters.map((p, pIndex) => (paramIndex !== pIndex ? p : parameter)));
  };

  const handleAdd = () => {
    onChange([...parameters, DEFAULT_PARAMETER]);
  };

  const handleRemove = (paramIndex: number) => {
    onErrorsChange(
      errors.filter((error) => !arrayStartsWith(error.path, ['parameters', 'instance']))
    );
    onChange(parameters.filter((_, index) => index !== paramIndex));
  };

  return (
    <div className={styles.instanceParameters.container}>
      <FormLabel htmlFor="">
        Instance parameter definitions <NewTag />
      </FormLabel>
      <HelpText className={c([styles.helpParagraph, styles.instanceParameters.help])}>
        Instance parameters are helpful when configuring an app for fields, sidebars and editors.
      </HelpText>

      {disabled && (
        <Note className={styles.instanceParameters.note}>
          Instance parameters require the entry field, entry sidebar or entry editor location to be
          enabled.
        </Note>
      )}

      <table className={styles.instanceParameters.table}>
        <tbody>
          {parameters.map((parameter, parameterIndex) => (
            <ParameterRow
              key={parameterIndex}
              parameter={parameter}
              onChange={(parameter) => handleChange(parameterIndex, parameter)}
              onRemove={() => handleRemove(parameterIndex)}
              errors={errors}
              errorPath={['parameters', 'instance', parameterIndex]}
              clearErrorForField={clearErrorForField}
              onErrorsChange={onErrorsChange}
              disabled={disabled}
            />
          ))}
        </tbody>
      </table>

      <Tooltip
        content={
          parameters.length >= PARAM_LIMIT &&
          `You cannot add more than ${PARAM_LIMIT} parameter definitions`
        }
        place="right">
        <Button
          buttonType="muted"
          icon="Plus"
          onClick={handleAdd}
          disabled={parameters.length >= PARAM_LIMIT || disabled}>
          Add instance parameter definition
        </Button>
      </Tooltip>
    </div>
  );
}

interface ParameterRowProps {
  parameter: ParameterDefinition;
  onChange: (parameter: ParameterDefinition) => void;
  onRemove: () => void;
  errors: ValidationError[];
  errorPath: ValidationError['path'];
  onErrorsChange: (errors: ValidationError[]) => void;
  clearErrorForField: (errors: ValidationError['path']) => void;
  disabled: boolean;
}

function ParameterRow({
  parameter,
  onChange,
  onRemove,
  errors,
  errorPath,
  onErrorsChange,
  clearErrorForField,
  disabled,
}: ParameterRowProps) {
  return (
    <tr>
      <td>
        <Select
          value={parameter.type}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => {
            onErrorsChange(
              errors.filter(
                (error) =>
                  !isEqual(error.path, [...errorPath, 'type']) ||
                  !isEqual(error.path, [...errorPath, 'default']) ||
                  !arrayStartsWith(error.path, [...errorPath, 'options'])
              )
            );
            const type = e.target.value as ParameterDefinition['type'];
            onChange({
              ...parameter,
              type: type,
              default: DEFAULT_DEFAULT_VALUES[type],
              options: undefined,
            });
          }}
          isDisabled={disabled}>
          <Option value="Symbol">Short text</Option>
          <Option value="Boolean">Boolean</Option>
          <Option value="Number">Number</Option>
          <Option value="Enum">Select</Option>
        </Select>
        <ConditionalValidationMessage errors={errors} path={[...errorPath, 'type']} />
      </td>
      <td>
        <TextInput
          placeholder="ID"
          value={parameter.id}
          onChange={(e) => {
            clearErrorForField([...errorPath, 'id']);
            onChange({ ...parameter, id: e.target.value });
          }}
          pattern={PARAMETER_ID_REG_EXP.toString()}
          required
          disabled={disabled}
        />
        <ConditionalValidationMessage errors={errors} path={[...errorPath, 'id']} />
      </td>
      <td>
        <TextInput
          placeholder="Display name"
          value={parameter.name}
          onChange={(e) => {
            clearErrorForField([...errorPath, 'name']);
            onChange({ ...parameter, name: e.target.value });
          }}
          required
          disabled={disabled}
        />
        <ConditionalValidationMessage errors={errors} path={[...errorPath, 'name']} />
      </td>
      <td>
        {parameter.type === 'Enum' && (
          <EnumOptionsDialog
            defaultValue={parameter.default as string}
            options={Object.fromEntries(
              (parameter.options ?? []).map((value) =>
                typeof value === 'object' ? Object.entries(value)[0] : [value, value]
              )
            )}
            onChange={(options, defaultValue) => {
              onErrorsChange(
                errors.filter((error) => !arrayStartsWith(error.path, [...errorPath, 'options']))
              );
              onChange({
                ...parameter,
                options: Object.entries(options).map(([value, label]) => ({ [value]: label })),
                default: defaultValue,
              });
            }}
            errors={errors}
            onErrorsChange={onErrorsChange}
            errorPath={[...errorPath, 'options']}
            disabled={disabled}
          />
        )}
        {parameter.type !== 'Enum' && (
          <DefaultInput
            type={parameter.type}
            value={parameter.default}
            onChange={(newDefault) => {
              clearErrorForField([...errorPath, 'default']);
              onChange({ ...parameter, default: newDefault });
            }}
            disabled={disabled}
          />
        )}
      </td>
      <td>
        <IconButton
          buttonType="muted"
          iconProps={{ icon: 'Delete' }}
          label="Remove instance parameter"
          onClick={onRemove}
          disabled={disabled}
        />
      </td>
    </tr>
  );
}

function DefaultInput({
  type,
  value,
  onChange,
  disabled,
}: {
  type: ParameterDefinition['type'];
  value: ParameterDefinition['default'];
  onChange: (value: ParameterDefinition['default']) => void;
  disabled: boolean;
}) {
  switch (type) {
    case 'Symbol':
      return (
        <TextInput
          placeholder="Default value"
          type="text"
          value={(value as string | undefined) ?? ''}
          onChange={(e) => onChange(e.target.value)}
          maxLength={255}
          disabled={disabled}
        />
      );
    case 'Boolean':
      return (
        <Select
          value={value === true ? 'true' : 'false'}
          onChange={(e: ChangeEvent<HTMLSelectElement>) => onChange(Boolean(e.target.value))}
          isDisabled={disabled}>
          <Option value="false">False</Option>
          <Option value="true">True</Option>
        </Select>
      );
    case 'Number':
      return (
        <TextInput
          placeholder="Default value"
          type="number"
          value={toString(value)}
          onChange={(e) => onChange(isEmpty(e.target.value) ? undefined : toNumber(e.target.value))}
          disabled={disabled}
        />
      );
    case 'Enum':
      return null;
    default:
      return null;
  }
}
