import React from 'react';
import PropTypes from 'prop-types';
import escape from 'utils/escape.es6';
import { assign } from 'utils/Collections.es6';
import { makeCtor } from 'utils/TaggedValues.es6';
import { Notification } from '@contentful/forma-36-react-components';

import { bindActions, createStore, makeReducer } from 'ui/Framework/Store.es6';
import { getModule } from 'NgRegistry.es6';

const ModalDialog = getModule('modalDialog');

/**
 * This module exports a function to open the confirmation dialog to
 * delete an environments
 */

const TriggerDelete = makeCtor('TriggerDelete');
const SetInputValue = makeCtor('SetInputValue');
const SetInProgress = makeCtor('SetInProgress');

const reduce = makeReducer({
  [SetInProgress](state, inProgress) {
    return assign(state, { inProgress });
  },
  [SetInputValue](state, inputValue) {
    return assign(state, { inputValue });
  },
  [TriggerDelete](state, _, { runDelete, environment, closeDialog, dispatch }) {
    runDelete(environment.id).then(
      () => {
        Notification.success(
          `The environment “${escape(environment.id)}” has been successfully deleted.`
        );
        closeDialog(true);
      },
      () => {
        Notification.error(
          'Deleting failed, please try again. If the problem persists, contact support.'
        );
        dispatch(SetInProgress, false);
      }
    );
    return assign(state, { inProgress: true });
  }
});

/**
 * @param runDelete
 *   Function that receives an environment, sends the delete request to
 *   the API and returns the result in a promise
 * @param environment
 */
export function openDeleteDialog(runDelete, environment) {
  return ModalDialog.open({
    template: `
      <div className="modal-background">
        <div className="modal-dialog" style="width: 32px;">
          <cf-component-store-bridge component="component" />
        </div>
      </div>
    `.trim(),
    controller: $scope => {
      const closeDialog = value => $scope.dialog.confirm(value);
      $scope.component = createComponent(runDelete, environment, closeDialog);
    },
    backgroundClose: false
  }).promise;
}

function createComponent(runDelete, environment, closeDialog) {
  const context = { runDelete, environment, closeDialog };
  const initialState = {
    confirmationId: environment.id,
    inputValue: ''
  };

  const store = createStore(initialState, (action, state) => reduce(action, state, context));
  context.dispatch = store.dispatch;

  const actions = bindActions(store, {
    SetInputValue,
    TriggerDelete
  });

  Object.assign(actions, {
    CancelDialog: () => closeDialog(false),
    ConfirmDialog: () => closeDialog(true)
  });

  return { render: state => <SpaceEnvironmentsDeleteDialog {...assign(state, actions)} />, store };
}

function SpaceEnvironmentsDeleteDialog({
  inputValue,
  inProgress,
  confirmationId,
  TriggerDelete,
  CancelDialog,
  SetInputValue
}) {
  const confirmable = inputValue === confirmationId;
  return (
    <div data-test-id="spaceEnvironmentsDeleteDialog">
      <header className="modal-dialog__header">
        <h1>Delete environment</h1>
        <button onClick={() => CancelDialog()} className="modal-dialog__close" />
      </header>
      <div style={{ paddingBottom: '30px' }} className="modal-dialog__content">
        <p>
          {`You are about to delete the environment `}
          <strong>{confirmationId}</strong>
          {`. All of the environment data, including the environment
      itself, will be deleted. This operation cannot be undone.`}
        </p>
        <div className="cfnext-form__field" style={{ marginTop: 28 }}>
          <label style={{ fontWeight: '600' }}>Type the ID of the environment to confirm</label>
          <input
            data-test-id="confirmId"
            value={inputValue}
            onInput={ev => SetInputValue(ev.target.value)}
            className="cfnext-form__input--full-size"
          />
        </div>
        <div style={{ display: 'flex', marginTop: 5 }}>
          <button
            disabled={inProgress || !confirmable}
            onClick={() => TriggerDelete()}
            data-test-id="delete"
            className={`btn-caution ${inProgress && 'is-loading'}`}>
            Delete environment
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
      </div>
    </div>
  );
}
SpaceEnvironmentsDeleteDialog.propTypes = {
  inputValue: PropTypes.string,
  inProgress: PropTypes.bool,
  confirmationId: PropTypes.string,
  TriggerDelete: PropTypes.func,
  CancelDialog: PropTypes.func,
  SetInputValue: PropTypes.func
};
