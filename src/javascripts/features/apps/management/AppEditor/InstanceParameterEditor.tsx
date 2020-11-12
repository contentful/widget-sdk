import {
  Button,
  CopyButton,
  Dropdown,
  DropdownList,
  DropdownListItem,
  FormLabel,
  HelpText,
  IconButton,
  Note,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextLink,
  Tooltip,
} from '@contentful/forma-36-react-components';
import c from 'classnames';
import { NewTag } from 'components/shared/NewTag';
import { noop } from 'lodash';
import React, { useState } from 'react';
import { ConditionalValidationMessage } from './ConditionalValidationMessage';
import { PARAMETER_TYPE_LABEL } from './constants';
import { InstanceParameterDialog } from './InstanceParameterDialog';
import { styles } from './styles';
import { ParameterDefinition, ValidationError } from './types';
import { arrayStartsWith } from './util';

const PARAM_LIMIT = 8;

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
  const [newModalOpen, setNewModalOpen] = useState(false);

  const handleChange = (paramIndex: number, parameter: ParameterDefinition) => {
    onChange(parameters.map((p, pIndex) => (paramIndex !== pIndex ? p : parameter)));
  };

  const handleRemove = (paramIndex: number) => {
    onErrorsChange(
      errors.filter((error) => !arrayStartsWith(error.path, ['parameters', 'instance']))
    );
    onChange(parameters.filter((_, index) => index !== paramIndex));
  };

  return (
    <>
      <div className={styles.instanceParameters.container}>
        <FormLabel htmlFor="">
          Instance parameter definitions <NewTag />
        </FormLabel>
        <HelpText className={c([styles.helpParagraph, styles.instanceParameters.help])}>
          Instance parameters are helpful when configuring an app for fields, sidebars and editors.
          <br />
          <TextLink
            href="https://www.contentful.com/developers/docs/concepts/widget-parameters"
            target="_blank"
            rel="noopener noreferrer">
            Learn more about instance parameters
          </TextLink>
        </HelpText>

        {disabled && (
          <Note className={styles.instanceParameters.note}>
            Instance parameters require the entry field, entry sidebar or entry editor location to
            be enabled.
          </Note>
        )}

        <Tooltip
          content={
            parameters.length >= PARAM_LIMIT &&
            `You cannot add more than ${PARAM_LIMIT} parameter definitions`
          }
          place="right">
          <Button
            buttonType="muted"
            icon="Plus"
            onClick={() => setNewModalOpen(true)}
            disabled={parameters.length >= PARAM_LIMIT || disabled}>
            Add instance parameter definition
          </Button>
        </Tooltip>

        {parameters.length > 0 && (
          <Table className={styles.instanceParameters.table}>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Display name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {parameters.map((parameter, parameterIndex) => (
                <ParameterRow
                  key={parameterIndex}
                  parameter={parameter}
                  onChange={(newParameter) => {
                    handleChange(parameterIndex, newParameter);
                    onErrorsChange(
                      errors.filter(
                        (error) =>
                          !arrayStartsWith(error.path, ['parameters', 'instance', parameterIndex])
                      )
                    );
                  }}
                  onRemove={() => handleRemove(parameterIndex)}
                  errors={errors}
                  errorPath={['parameters', 'instance', parameterIndex]}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      <InstanceParameterDialog
        parameter={{ id: '', name: '', type: 'Symbol' }}
        open={newModalOpen}
        onClose={() => setNewModalOpen(false)}
        onSave={(newParameter) => {
          onChange([...parameters, newParameter]);
        }}
        errorPath={['parameters', 'instance', parameters.length]}
      />
    </>
  );
}

interface ParameterRowProps {
  parameter: ParameterDefinition;
  onChange: (parameter: ParameterDefinition) => void;
  onRemove: () => void;
  errors: ValidationError[];
  errorPath: ValidationError['path'];
}

function ParameterRow({ parameter, onRemove, onChange, errors, errorPath }: ParameterRowProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <TableRow>
        <TableCell className={styles.instanceParameters.idCell}>
          <span className={styles.monospace}>{parameter.id}</span>
          <CopyButton copyValue={parameter.id} />
          <ConditionalValidationMessage errors={errors} path={[...errorPath, 'id']} />
        </TableCell>
        <TableCell>
          {parameter.name}
          <ConditionalValidationMessage errors={errors} path={[...errorPath, 'name']} />
        </TableCell>
        <TableCell>{PARAMETER_TYPE_LABEL[parameter.type]}</TableCell>
        <TableCell>
          <Dropdown
            isOpen={dropdownOpen}
            onClose={() => setDropdownOpen(false)}
            toggleElement={
              <IconButton
                iconProps={{ icon: 'MoreHorizontal' }}
                onClick={() => setDropdownOpen(!dropdownOpen)}
                label="Remove parameter"
              />
            }>
            <DropdownList>
              <DropdownListItem
                onClick={() => {
                  setDropdownOpen(false);
                  setModalOpen(true);
                }}>
                Edit
              </DropdownListItem>
              <DropdownListItem
                onClick={() => {
                  setDropdownOpen(false);
                  onRemove();
                }}>
                Remove
              </DropdownListItem>
            </DropdownList>
          </Dropdown>
        </TableCell>
      </TableRow>

      <InstanceParameterDialog
        parameter={parameter}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={onChange}
        errors={errors}
        errorPath={errorPath}
      />
    </>
  );
}
