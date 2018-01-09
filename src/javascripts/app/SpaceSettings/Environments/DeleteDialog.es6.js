import { text } from 'utils/hyperscript';
import { assign } from 'utils/Collections';
import { makeCtor } from 'utils/TaggedValues';
import { truncate } from 'stringUtils';

import { bindActions, createStore, makeReducer } from 'ui/Framework/Store';
import { h, renderString } from 'ui/Framework';
import { hbox, hspace, vspace } from 'ui/Layout';

import ModalDialog from 'modalDialog';
import Notification from 'notification';

/**
 * This module exports a function to open the confirmation dialog to
 * delete an environments
 */

const TriggerDelete = makeCtor('TriggerDelete');
const SetInputValue = makeCtor('SetInputValue');
const SetInProgress = makeCtor('SetInProgress');


const reduce = makeReducer({
  [SetInProgress] (state, inProgress) {
    return assign(state, { inProgress });
  },
  [SetInputValue] (state, inputValue) {
    return assign(state, { inputValue });
  },
  [TriggerDelete] (state, _, { runDelete, environment, closeDialog, dispatch }) {
    runDelete(environment.id)
      .then(
        () => {
          const name = text(truncate(environment.name, 30));
          Notification.info(
            `The environment “${name}” has been successfully deleted.`
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
export function openDeleteDialog (runDelete, environment) {
  return ModalDialog.open({
    template: renderString(h('.modal-background', [
      h('.modal-dialog', { style: { width: '32em' } }, [
        h('cf-component-store-bridge', { component: 'component' })
      ])
    ])),
    controller: ($scope) => {
      const closeDialog = (value) => $scope.dialog.confirm(value);
      $scope.component = createComponent(runDelete, environment, closeDialog);
    },
    backgroundClose: false
  }).promise;
}

function createComponent (runDelete, environment, closeDialog) {
  const context = { runDelete, environment, closeDialog };
  const initialState = {
    confirmationName: environment.name,
    inputValue: ''
  };

  const store = createStore(
    initialState,
    (action, state) => reduce(action, state, context)
  );
  context.dispatch = store.dispatch;

  const actions = bindActions(store, {
    SetInputValue, TriggerDelete
  });

  Object.assign(actions, {
    CancelDialog: () => closeDialog(false),
    ConfirmDialog: () => closeDialog(true)
  });

  return { render: (state) => render(assign(state, actions)), store };
}


function render ({
  inputValue,
  inProgress,
  confirmationName,
  TriggerDelete,
  CancelDialog,
  SetInputValue
}) {
  const confirmable = inputValue === confirmationName;
  return h('div', {
    dataTestId: 'spaceEnvironmentsDeleteDialog'
  }, [
    h('header.modal-dialog__header', [
      h('h1', [ 'Delete environment' ]),
      h('button.modal-dialog__close', {
        onClick: () => CancelDialog()
      })
    ]),
    h('.modal-dialog__content', {
      style: {paddingBottom: '30px'}
    }, [
      h('p', [
        `You are about to delete the environment `,
        h('strong', [ confirmationName ]),
        `. All of the environment data, including the environment
        itself, will be deleted. This operation cannot be undone.`
      ]),
      vspace(5),
      h('.cfnext-form__field', [
        h('label', {style: { fontWeight: '600' }}, [
          'Type the name of the environment to confirm'
        ]),
        h('input.cfnext-form__input--full-size', {
          dataTestId: 'confirmName',
          value: inputValue,
          onInput: (ev) => SetInputValue(ev.target.value)
        })
      ]),
      vspace(5),
      hbox([
        h('button.btn-caution', {
          class: inProgress && 'is-loading',
          disabled: inProgress || !confirmable,
          onClick: () => TriggerDelete(),
          dataTestId: 'delete'
        }, [ 'Delete environment' ]),
        hspace('10px'),
        h('button.btn-secondary-action', {
          type: 'button',
          onClick: () => CancelDialog(),
          dataTestId: 'cancel'
        }, ['Cancel'])
      ])
    ])
  ]);
}
