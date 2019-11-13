import React, { useRef, useEffect } from 'react';
import { Modal } from '@contentful/forma-36-react-components';
import ModalLauncher from 'app/common/ModalLauncher';
import * as Config from 'Config';
import PropTypes from 'prop-types';
import { LinkOpen } from 'ui/Content';
import {
  Button,
  Note,
  Form,
  TextField,
  SelectField,
  Option
} from '@contentful/forma-36-react-components';
import tokens from '@contentful/forma-36-tokens';
import { css } from 'emotion';
import { useCreateEnvState } from './CreateEnvDialogReducer';

/**
 * Open the create dialog for a space environment.
 *
 * The argument is a function that creates the environment. See
 * `data/CMA/SpaceEnvironmentRepo` for details.
 *
 * It returns a promise that resolves with a boolean that is true if
 * the environment was created.
 */
export function openCreateEnvDialog(
  createEnvironment,
  environments,
  currentEnvironment,
  canSelectSource
) {
  const uniqueModalId = `create-env` + Date.now();

  return ModalLauncher.open(({ isShown, onClose }) => (
    <Modal
      isShown={isShown}
      key={uniqueModalId}
      shouldCloseOnOverlayClick={false}
      title="Add environment"
      testId="spaceEnvironmentsEditDialog"
      onClose={() => onClose(false)}>
      <CreateEnvironmentView
        createEnvironment={createEnvironment}
        environments={environments}
        currentEnvironment={currentEnvironment}
        canSelectSource={canSelectSource}
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
    marginBottom: tokens.spacingM
  }),
  dialogActions: css({
    display: 'flex',
    marginBottom: `-${tokens.spacingL}`,
    button: {
      marginRight: tokens.spacingM
    }
  })
};

export function CreateEnvironmentView(props) {
  const [state, actions] = useCreateEnvState({
    environments: props.environments,
    currentEnvironment: props.currentEnvironment,
    canSelectSource: props.canSelectSource,
    createEnvironment: props.createEnvironment,
    onClose: props.onClose,
    onCreate: props.onCreate
  });

  return state.serverFailure ? (
    <DisplayServerError {...state} {...actions} />
  ) : (
    <CreateForm {...state} {...actions} />
  );
}

CreateEnvironmentView.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreate: PropTypes.func.isRequired,
  createEnvironment: PropTypes.func.isRequired,
  canSelectSource: PropTypes.bool,
  environments: PropTypes.any,
  selectedEnvironment: PropTypes.any,
  currentEnvironment: PropTypes.any
};

const CreateEnvironmentViewPropTypes = {
  serverFailure: PropTypes.any,
  fields: PropTypes.any,
  inProgress: PropTypes.bool,
  canSelectSource: PropTypes.bool,
  environments: PropTypes.any,
  selectedEnvironment: PropTypes.any,
  currentEnvironment: PropTypes.any,
  SetFieldValue: PropTypes.func.isRequired,
  SetSourceEnvironment: PropTypes.func.isRequired,
  CancelDialog: PropTypes.func.isRequired,
  Submit: PropTypes.func.isRequired
};

function CreateForm({
  inProgress,
  fields,
  environments,
  canSelectSource,
  selectedEnvironment,
  Submit,
  SetFieldValue,
  SetSourceEnvironment,
  CancelDialog,
  currentEnvironment
}) {
  const inputRef = useRef(null);

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  return (
    <Form
      onSubmit={ev => {
        ev.preventDefault();
        Submit();
      }}>
      <TextField
        labelText="ID"
        required
        textInputProps={{
          inputRef,
          testId: 'field.id'
        }}
        name={`field.${fields.id.name}`}
        id={`field.${fields.id.name}`}
        maxLength={40}
        type="text"
        helpText="The environment ID represents how it is referred to in the API"
        value={fields.id.value}
        onChange={ev => {
          SetFieldValue({ name: fields.id.name, value: ev.target.value });
        }}
        validationMessage={
          fields.id.errors.length > 0 ? fields.id.errors.map(error => error.message).join('\n') : ''
        }
      />

      {canSelectSource && (
        <SelectField
          selectProps={{
            testId: 'source.id'
          }}
          labelText="Clone new environment from"
          required
          id="field.source"
          name="field.source"
          value={selectedEnvironment}
          onChange={ev => SetSourceEnvironment({ value: ev.target.value })}>
          {environments.map(env => {
            return (
              <Option key={env.id} value={env.id}>
                {env.id === currentEnvironment ? `${env.id} (current)` : `${env.id}`}
              </Option>
            );
          })}
        </SelectField>
      )}
      <DialogActions
        submitLabel="Add environment"
        inProgress={inProgress}
        CancelDialog={CancelDialog}
      />
    </Form>
  );
}

CreateForm.propTypes = CreateEnvironmentViewPropTypes;

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

DisplayServerError.propTypes = CreateEnvironmentViewPropTypes;

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
  Submit: PropTypes.func
};
