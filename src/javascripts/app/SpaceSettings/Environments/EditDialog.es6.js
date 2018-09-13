import { mapValues } from 'lodash';
import { assign, get, set, update } from 'utils/Collections.es6';
import * as C from 'utils/Concurrent.es6';
import { match, makeCtor } from 'utils/TaggedValues.es6';
import * as Environment from 'data/CMA/SpaceEnvironmentsRepo.es6';

import logger from 'logger';
import { open as openDialog } from 'modalDialog';

import { bindActions, createStore, makeReducer } from 'ui/Framework/Store.es6';
import { h } from 'utils/legacy-html-hyperscript';
import render from './EditDialogView.es6';

// Actions
const SetFieldValue = makeCtor('SetFieldValue');
const Submit = makeCtor('Submit');
const ReceiveResult = makeCtor('ReceiveResult');

const ID_EXISTS_ERROR_MESSAGE =
  'This ID already exists in your space. Please make sure it’s unique.';
const INVALID_ID_CHARACTER_ERROR_MESSAGE =
  'Please use only letters, numbers, underscores, dashes and dots for the ID.';
const EMPTY_FIELD_ERROR_MESSAGE = 'Please fill out this field.';

/**
 * Open the create dialog for a space environment.
 *
 * The argument is a function that creates the environment. See
 * `data/CMA/SpaceEnvironmentRepo` for details.
 *
 * It returns a promise that resolves with a boolean that is true if
 * the environment was created.
 */
export function openCreateDialog(createEnvironment) {
  const initialState = {
    fields: {
      id: { name: 'id', errors: [] }
    }
  };

  return openDialog({
    template: h('.modal-background', [
      h('.modal-dialog', { style: { width: '32em' } }, [
        h('cf-component-store-bridge', { component: 'component' })
      ])
    ]),
    controller: $scope => {
      $scope.component = createComponent(initialState, { createEnvironment }, value => {
        $scope.dialog.confirm(value);
      });
    },
    backgroundClose: false
  }).promise;
}

function createComponent(initialState, context, closeDialog) {
  const store = createStore(
    initialState,
    // eslint-disable-next-line no-use-before-define
    (action, state) => reduce(action, state, context, actions)
  );

  const actions = bindActions(store, {
    SetFieldValue,
    Submit,
    ReceiveResult
  });

  Object.assign(actions, {
    CancelDialog: () => closeDialog(false),
    ConfirmDialog: () => closeDialog(true)
  });

  return { store, render: state => render(assign(state, actions)) };
}

const reduce = makeReducer({
  [SetFieldValue](state, { name, value }) {
    return set(state, ['fields', name, 'value'], value);
  },
  [Submit](state, _, context, actions) {
    state = update(state, 'fields', clearErrors);
    const fieldsWithErrors = validate(state.fields);
    if (fieldsWithErrors) {
      state = set(state, 'fields', fieldsWithErrors);
    } else {
      C.runTask(function*() {
        const id = get(state, ['fields', 'id', 'value']);
        const result = yield context.createEnvironment({ id, name: id });
        actions.ReceiveResult(result);
      });
      state = set(state, 'inProgress', true);
    }
    return state;
  },
  [ReceiveResult](state, result, _, actions) {
    state = set(state, 'inProgress', false);
    state = match(result, {
      [Environment.EnvironmentUpdated]: () => {
        actions.ConfirmDialog();
        return state;
      },
      [Environment.IdExistsError]: () => {
        return set(state, ['fields', 'id', 'errors'], [{ message: ID_EXISTS_ERROR_MESSAGE }]);
      },
      [Environment.ServerError]: error => {
        logger.logServerError(error);
        return set(state, 'serverFailure', true);
      }
    });
    return state;
  }
});

// Regular expression to validate IDs against
const ID_REGEXP = /^[a-zA-Z0-9._-]{1,64}$/;

/**
 * Object with validations for the different fields. The values are
 * functions that take the field value and return an error if the field
 * value is invalid.
 */
const validations = {
  id: value => {
    if (!value || !value.trim()) {
      return EMPTY_FIELD_ERROR_MESSAGE;
    }
    if (!value.match(ID_REGEXP)) {
      return INVALID_ID_CHARACTER_ERROR_MESSAGE;
    }
  }
};

/**
 * Runs the validations defined above against the fields.
 *
 * Returns the fields with the errors set if any of the values is
 * invalid and returns `undefined` otherwise.
 */
function validate(fields) {
  let hasErrors = false;

  const fieldsWithErrors = mapValues(fields, (field, name) => {
    const validateField = validations[name];
    const errorMessage = validateField(field.value);
    if (errorMessage) {
      hasErrors = true;
      return set(field, 'errors', [{ message: errorMessage }]);
    } else {
      return field;
    }
  });

  if (hasErrors) {
    return fieldsWithErrors;
  } else {
    return null;
  }
}

function clearErrors(fields) {
  return mapValues(fields, fields => set(fields, 'errors', []));
}
