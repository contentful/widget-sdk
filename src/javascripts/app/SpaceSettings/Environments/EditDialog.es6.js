import { mapValues } from 'lodash';
import { assign, get, set, update } from 'utils/Collections';
import * as C from 'utils/Concurrent';
import { match, makeCtor } from 'utils/TaggedValues';
import { toIdentifier } from 'stringUtils';

import logger from 'logger';
import {open as openDialog} from 'modalDialog';

import { bindActions, createStore, makeReducer } from 'ui/Framework/Store';
import { h, renderString } from 'ui/Framework';
import render from './EditDialogView';

// Actions
const SetFieldValue = makeCtor('SetFieldValue');
const Submit = makeCtor('Submit');
const ReceiveResult = makeCtor('ReceiveResult');

const INVALID_ID_CHARACTER_ERROR_MESSAGE =
  'Please use only letters, numbers, underscores, and dashes for the ID.';
const EMPTY_FIELD_ERROR_MESSAGE =
  'Please fill out this field.';


/**
 * Open the create dialog for a space environment.
 *
 * The argument is a function that creates the environment. See
 * `data/CMA/SpaceEnvironmentRepo` for details.
 *
 * It returns a promise that resolves with a boolean that is true if
 * the environment was created.
 */
export function openCreateDialog (createEnvironment) {
  const initialState = {
    fields: {
      name: { name: 'name', errors: [] },
      id: { name: 'id', errors: [], touched: false }
    },
    config: {
      showIdField: true,
      dialogTitle: 'Add environment',
      submitLabel: 'Add environment'
    }
  };

  const context = {
    setEnvironment: createEnvironment
  };

  return openBaseDialog(initialState, context);
}


/**
 * Open the edit dialog for a space environment.
 *
 * The argument is a function that updates the environment (see
 * `data/CMA/SpaceEnvironmentRepo`) and the current environment data.
 *
 * It returns a promise that resolves with a boolean that is true if
 * the environment was updated.
 */
export function openEditDialog (updateEnvironment, initialEnvironment) {
  const initialState = {
    fields: {
      name: { name: 'name', errors: [], value: initialEnvironment.name }
    },
    config: {
      showIdField: false,
      dialogTitle: 'Edit environment',
      submitLabel: 'Save changes'
    }
  };

  const context = {
    setEnvironment: ({ name }) => {
      return updateEnvironment(assign(initialEnvironment, { name }));
    }
  };

  return openBaseDialog(initialState, context);
}


function openBaseDialog (initialState, context) {
  return openDialog({
    template: renderString(h('.modal-background', [
      h('.modal-dialog', { style: { width: '32em' } }, [
        h('cf-component-store-bridge', { component: 'component' })
      ])
    ])),
    controller: ($scope) => {
      $scope.component = createComponent(initialState, context, (value) => {
        $scope.dialog.confirm(value);
      });
    },
    backgroundClose: false
  }).promise;
}


function createComponent (initialState, context, closeDialog) {
  const store = createStore(
    initialState,
    // eslint-disable-next-line no-use-before-define
    (action, state) => reduce(action, state, context, actions)
  );

  const actions = bindActions(store, {
    SetFieldValue, Submit, ReceiveResult
  });

  Object.assign(actions, {
    CancelDialog: () => closeDialog(false),
    ConfirmDialog: () => closeDialog(true)
  });

  return { store, render: (state) => render(assign(state, actions)) };
}


const reduce = makeReducer({
  [SetFieldValue] (state, { name, value }) {
    state = set(state, ['fields', name, 'value'], value);
    state = set(state, ['fields', name, 'touched'], true);

    // If the user changes the name and they did not touch the ID yet
    // we provide an auto-generated id for the
    if (name === 'name' && get(state, ['fields', 'id', 'touched']) === false) {
      state = set(state, ['fields', 'id', 'value'], toIdentifier(value));
    }

    return state;
  },
  [Submit] (state, _, env, actions) {
    state = update(state, 'fields', clearErrors);
    const fieldsWithErrors = validate(state.fields);
    if (fieldsWithErrors) {
      state = set(state, 'fields', fieldsWithErrors);
    } else {
      C.runTask(function* () {
        const result = yield C.tryP(env.setEnvironment({
          id: get(state, ['fields', 'id', 'value']),
          name: get(state, ['fields', 'name', 'value'])
        }));
        actions.ReceiveResult(result);
      });
      state = set(state, 'inProgress', true);
    }
    return state;
  },
  [ReceiveResult] (state, result, _, actions) {
    state = set(state, 'inProgress', false);
    state = match(result, {
      [C.Success]: () => {
        actions.ConfirmDialog();
        return state;
      },
      [C.Failure]: (error) => {
        logger.logError(error);
        return set(state, 'serverFailure', true);
      }
    });
    return state;
  }
});


// Regular expression to validate IDs against
const ID_REGEXP = /^[0-9a-zA-Z\-._]{1,64}$/;


/**
 * Object with validations for the different fields. The values are
 * functions that take the field value and return an error if the field
 * value is invalid.
 */
const validations = {
  name: (value) => {
    if (!value || !value.trim()) {
      return EMPTY_FIELD_ERROR_MESSAGE;
    }
  },
  id: (value) => {
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
function validate (fields) {
  let hasErrors = false;

  const fieldsWithErrors = mapValues(fields, (field, name) => {
    const validateField = validations[name];
    const errorMessage = validateField(field.value);
    if (errorMessage) {
      hasErrors = true;
      return set(field, 'errors', [{message: errorMessage}]);
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


function clearErrors (fields) {
  return mapValues(fields, (fields) => set(fields, 'errors', []));
}
