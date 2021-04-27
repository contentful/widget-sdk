import React, { useRef, useEffect } from 'react';
import { Modal } from '@contentful/forma-36-react-components';
import { ModalLauncher } from '@contentful/forma-36-react-components';
import * as Config from 'Config';
import PropTypes from 'prop-types';
import { LinkOpen } from 'ui/Content';
import {
  Button,
  Note,
  Form,
  TextField,
  SelectField,
  Option,
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { useCreateEnvAliasState } from './CreateEnvAliasDialogReducer';

/**
 * Open the create dialog for a space environment.
 *
 * The argument is a function that creates the environment. See
 * `data/CMA/SpaceEnvironmentRepo` for details.
 *
 * It returns a promise that resolves with a boolean that is true if
 * the environment was created.
 */
export function openCreateEnvAliasDialog(createEnvironmentAlias, environments, currentEnvironment) {
  const uniqueModalId = `create-env-alias` + Date.now();

  return ModalLauncher.open(({ isShown, onClose }) => (
    <Modal
      isShown={isShown}
      key={uniqueModalId}
      shouldCloseOnOverlayClick={false}
      title="Add environment alias"
      testId="spaceEnvironmentsEditDialog"
      onClose={() => onClose(false)}>
      <CreateEnvironmentAliasView
        createEnvironmentAlias={createEnvironmentAlias}
        environments={environments}
        currentEnvironment={currentEnvironment}
        onClose={() => {
          onClose(false);
        }}
        onCreate={() => {
          onClose(true);
        }}
      />
    </Modal>
  ));
}

const styles = {
  note: css({
    marginBottom: tokens.spacingM,
  }),
  dialogActions: css({
    display: 'flex',
    marginBottom: `-${tokens.spacingL}`,
    button: {
      marginRight: tokens.spacingM,
    },
  }),
};

export function CreateEnvironmentAliasView(props) {
  const [state, actions] = useCreateEnvAliasState({
    environments: props.environments,
    createEnvironmentAlias: ({ id, target }) =>
      props.createEnvironmentAlias({ id, aliasedEnvironment: target }),
    onClose: props.onClose,
    onCreate: props.onCreate,
  });

  return state.serverFailure ? (
    <DisplayServerError {...state} {...actions} />
  ) : (
    <CreateForm {...state} {...actions} />
  );
}

CreateEnvironmentAliasView.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  createEnvironmentAlias: PropTypes.func.isRequired,
  environments: PropTypes.any,
  selectedEnvironment: PropTypes.any,
};

function CreateForm({
  inProgress,
  fields,
  environments,
  selectedEnvironment,
  Submit,
  SetFieldValue,
  SetTargetEnvironment,
  CancelDialog,
  maxIdLength,
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <Form
      onSubmit={(ev) => {
        ev.preventDefault();
        Submit();
      }}>
      <TextField
        labelText="Alias ID"
        required
        textInputProps={{
          inputRef,
          testId: 'field.id',
          maxLength: maxIdLength,
          type: 'text',
          autoComplete: '', // Empty/random string because this apparently disables password managers. Very hacky, but only solution that worked, short of more hacking.
        }}
        countCharacters
        name={`field.${fields.id.name}`}
        id={`field.${fields.id.name}`}
        type="text"
        helpText="The environment alias ID represents how it is referred to in the API"
        value={fields.id.value}
        onChange={(ev) => {
          SetFieldValue({ name: fields.id.name, value: ev.target.value });
        }}
        validationMessage={
          fields.id.errors.length > 0
            ? fields.id.errors.map((error) => error.message).join('\n')
            : ''
        }
      />

      <SelectField
        selectProps={{
          testId: 'target.id',
        }}
        labelText="Target environment"
        required
        id="field.target"
        name="field.target"
        value={selectedEnvironment}
        onChange={(ev) => SetTargetEnvironment({ value: ev.target.value })}>
        {environments.map((env) => {
          return (
            <Option key={env.id} value={env.id}>
              {env.id}
            </Option>
          );
        })}
      </SelectField>

      <DialogActions
        submitLabel="Add environment alias"
        inProgress={inProgress}
        CancelDialog={CancelDialog}
      />
    </Form>
  );
}

CreateForm.propTypes = {
  fields: PropTypes.any,
  inProgress: PropTypes.bool,
  environments: PropTypes.any,
  selectedEnvironment: PropTypes.any,
  SetFieldValue: PropTypes.func.isRequired,
  SetTargetEnvironment: PropTypes.func.isRequired,
  CancelDialog: PropTypes.func.isRequired,
  Submit: PropTypes.func.isRequired,
  maxIdLength: PropTypes.number,
};

function DisplayServerError({ inProgress, CancelDialog, Submit }) {
  return (
    <>
      <Note title="Something went wrong" className={styles.note}>
        The creation of the environment has failed, probably due to a connection error. Please retry
        or{' '}
        <LinkOpen key="contact-support-link" url={Config.supportUrl}>
          contact support
        </LinkOpen>{' '}
        if the problem persists.
      </Note>
      <DialogActions
        submitLabel="Retry"
        inProgress={inProgress}
        CancelDialog={CancelDialog}
        Submit={Submit}
      />
    </>
  );
}

DisplayServerError.propTypes = {
  inProgress: PropTypes.bool,
  CancelDialog: PropTypes.func.isRequired,
  Submit: PropTypes.func.isRequired,
};

function DialogActions({ submitLabel, inProgress, CancelDialog, Submit }) {
  return (
    <div className={styles.dialogActions}>
      <Button
        type="submit"
        disabled={inProgress}
        onClick={Submit && (() => Submit())}
        testId="submit"
        loading={inProgress}
        buttonType="positive">
        {submitLabel}
      </Button>
      <Button type="button" onClick={() => CancelDialog()} testId="cancel" buttonType="muted">
        Cancel
      </Button>
    </div>
  );
}

DialogActions.propTypes = {
  submitLabel: PropTypes.string.isRequired,
  inProgress: PropTypes.bool,
  CancelDialog: PropTypes.func.isRequired,
  Submit: PropTypes.func,
};
