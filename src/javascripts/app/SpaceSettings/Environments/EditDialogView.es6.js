import * as Config from 'Config.es6';
import React from 'react';
import PropTypes from 'prop-types';
import { LinkOpen } from 'ui/Content.es6';

const SpaceEnvironmentsEditDialogPropTypes = {
  serverFailure: PropTypes.any,
  fields: PropTypes.any,
  inProgress: PropTypes.boolean,
  canSelectSource: PropTypes.boolean,
  environments: PropTypes.any,
  selectedEnvironment: PropTypes.any,
  currentEnvironment: PropTypes.any,
  SetFieldValue: PropTypes.func.isRequired,
  SetSourceEnvironment: PropTypes.func.isRequired,
  CancelDialog: PropTypes.func.isRequired,
  Submit: PropTypes.func.isRequired
};

export default function SpaceEnvironmentsEditDialog(props) {
  const { serverFailure, CancelDialog } = props;
  return (
    <div data-test-id="spaceEnvironmentsEditDialog">
      <header className="modal-dialog__header">
        <h1>Add environment</h1>
        <button className="modal-dialog__close" onClick={() => CancelDialog()} />
      </header>
      <div className="modal-dialog__content" style={{ paddingBottom: '30px' }}>
        {serverFailure ? <DisplayServerError {...props} /> : <Form {...props} />}
      </div>
    </div>
  );
}
SpaceEnvironmentsEditDialog.propTypes = SpaceEnvironmentsEditDialogPropTypes;

function Form({
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
  return (
    <form
      onSubmit={ev => {
        ev.preventDefault();
        Submit();
      }}>
      <FormField
        label="ID"
        labelHint="(required)"
        field={fields.id}
        input={{
          'data-test-id': 'field.id',
          type: 'text',
          maxLength: '64'
        }}
        hint="The environment ID represents how it is referred to in the API"
        SetFieldValue={SetFieldValue}
      />

      {canSelectSource && (
        <SourceEnvironmentSelector
          SetSourceEnvironment={SetSourceEnvironment}
          environments={environments}
          currentEnvironment={currentEnvironment}
          selectedEnvironment={selectedEnvironment}
        />
      )}

      <DialogActions
        submitLabel="Add environment"
        inProgress={inProgress}
        CancelDialog={CancelDialog}
      />
    </form>
  );
}
Form.propTypes = SpaceEnvironmentsEditDialogPropTypes;

function SourceEnvironmentSelector({
  SetSourceEnvironment,
  environments,
  currentEnvironment,
  selectedEnvironment
}) {
  return (
    <div className="cfnext-form__field">
      <label>
        <span style={{ fontWeight: 'bold' }}>Clone new environment from</span>
      </label>

      <select
        className="cfnext-select-box"
        style={{ display: 'block', width: '100%' }}
        onChange={ev => SetSourceEnvironment({ value: ev.target.value })}
        data-test-id="source.id"
        value={selectedEnvironment}>
        {environments.map(env => {
          return (
            <option key={env.id} value={env.id}>
              {env.id === currentEnvironment ? `${env.id} (current)` : `${env.id}`}
            </option>
          );
        })}
      </select>
    </div>
  );
}

SourceEnvironmentSelector.propTypes = {
  selectedEnvironment: PropTypes.object,
  currentEnvironment: PropTypes.object,
  environments: PropTypes.array,
  SetSourceEnvironment: PropTypes.func
};

function FormField({ label, labelHint, field, input, hint, SetFieldValue }) {
  return (
    <div className="cfnext-form__field">
      <label>
        <span style={{ fontWeight: 'bold' }}>{label}</span>
        <span className="cfnext-form__label-hint">{labelHint}</span>
      </label>
      <input
        className="cfnext-form__input"
        name={`field.${field.name}`}
        value={field.value || ''}
        onChange={ev => SetFieldValue({ name: field.name, value: ev.target.value })}
        aria-invalid={field.errors.length ? 'true' : undefined}
        auto-complete="off"
        style={{ width: '100%' }}
        {...input}
      />
      {field.errors.map(error => {
        return (
          <p key={error.message} className="cfnext-form__field-error">
            {error.message}
          </p>
        );
      })}
      {hint && <p className="cfnext-form__hint">{hint}</p>}
    </div>
  );
}

FormField.propTypes = {
  label: PropTypes.string,
  labelHint: PropTypes.string,
  field: PropTypes.object,
  input: PropTypes.object,
  hint: PropTypes.string,
  SetFieldValue: PropTypes.func
};

function DisplayServerError({ inProgress, CancelDialog, Submit }) {
  return (
    <div>
      <div className="note-box--warning" role="alert">
        <h3>Whoops! something went wrong</h3>
        <p>
          `The creation of the environment has failed, probably due to a connection error. Please
          retry or{' '}
          <LinkOpen key="contact-support-link" url={Config.supportUrl}>
            contact support
          </LinkOpen>{' '}
          if the problem persists.
        </p>
      </div>
      <div style={{ marginTop: '14px' }} />
      <DialogActions
        submitLabel="Retry"
        inProgress={inProgress}
        CancelDialog={CancelDialog}
        Submit={Submit}
      />
    </div>
  );
}
DisplayServerError.propTypes = SpaceEnvironmentsEditDialogPropTypes;

function DialogActions({ submitLabel, inProgress, CancelDialog, Submit }) {
  return (
    <div style={{ display: 'flex' }}>
      <button
        disabled={inProgress}
        onClick={Submit && (() => Submit())}
        data-test-id="submit"
        className={`btn-primary-action ${inProgress && 'is-loading'}`}>
        {submitLabel}
      </button>
      <button
        style={{ marginLeft: '10px' }}
        type="button"
        onClick={() => CancelDialog()}
        data-test-id="cancel"
        className="btn-secondary-action">
        Cancel
      </button>
    </div>
  );
}

DialogActions.propTypes = {
  submitLabel: PropTypes.string.isRequired,
  inProgress: PropTypes.bool.isRequired,
  CancelDialog: PropTypes.func.isRequired,
  Submit: PropTypes.func
};
