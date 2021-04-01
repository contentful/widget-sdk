import { useReducer } from 'react';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { mapValues, get } from 'lodash';
import { isValidResourceId } from 'data/utils';
import * as EnvironmentAlias from 'data/CMA/SpaceAliasesRepo';
import * as logger from 'services/logger';
import {
  temporarilyIgnoreAliasChangedToast,
  triggerAliasCreatedToast,
} from 'app/SpaceSettings/EnvironmentAliases/NotificationsService';

const MAX_ENV_ALIAS_ID_LENGTH = 64;

const ID_EXISTS_ERROR_MESSAGE =
  'This ID already exists in your space. Please make sure it’s unique.';
const INVALID_ID_CHARACTER_ERROR_MESSAGE =
  'Please use only letters, numbers, underscores, dashes and dots for the ID.';
const EMPTY_FIELD_ERROR_MESSAGE = 'Please fill out this field.';
const ENV_ALIAS_ID_TOO_LONG_ERROR_MESSAGE = `Please provide an ID that has ${MAX_ENV_ALIAS_ID_LENGTH} characters or less.`;

/**
 * Actions
 */

const SET_FIELD_VALUE = 'SET_FIELD_VALUE';
const SET_TARGET_ENV = 'SET_TARGET_ENV';
const SET_ERRORS = 'SUBMIT';
const SET_PROGRESS = 'SET_PROGRESS';
const SET_SERVER_FAILURE = 'SET_SERVER_FAILURE';

/**
 * Reducer
 */

export const createEnvAliasReducer = createImmerReducer({
  [SET_FIELD_VALUE]: (state, { name, value }) => {
    state.fields[name].value = value;
    state.fields[name].errors = [];
  },
  [SET_TARGET_ENV]: (state, { value }) => {
    state.selectedEnvironment = value;
  },
  [SET_ERRORS]: (state, { errors }) => {
    Object.keys(errors).forEach((key) => {
      state.fields[key].errors = errors[key];
    });
  },
  [SET_PROGRESS]: (state, { value }) => {
    state.inProgress = value;
  },
  [SET_SERVER_FAILURE]: (state, { value }) => {
    state.serverFailure = value;
  },
});

export const useCreateEnvAliasState = (props) => {
  const { environments, currentEnvironment, createEnvironmentAlias, onClose, onCreate } = props;
  const initialState = {
    fields: {
      id: {
        value: '',
        name: 'id',
        errors: [],
      },
    },
    environments,
    currentEnvironment,
    selectedEnvironment: currentEnvironment || environments[0].id,
    inProgress: false,
    maxIdLength: MAX_ENV_ALIAS_ID_LENGTH,
  };

  const [state, dispatch] = useReducer(createEnvAliasReducer, initialState);
  const Submit = async () => {
    const errors = validate(state.fields);
    if (errors) {
      dispatch({ type: SET_ERRORS, errors });
    } else {
      dispatch({ type: SET_PROGRESS, value: true });
      const id = get(state, ['fields', 'id', 'value']);
      temporarilyIgnoreAliasChangedToast();
      const result = await createEnvironmentAlias({
        id,
        name: id,
        target: state.selectedEnvironment,
      });

      if (result.type === EnvironmentAlias.EnvironmentAliasUpdated) {
        triggerAliasCreatedToast(id);
        onCreate(true);
      } else if (result.type === EnvironmentAlias.IdExistsError) {
        dispatch({
          type: SET_ERRORS,
          errors: {
            id: [
              {
                message: ID_EXISTS_ERROR_MESSAGE,
              },
            ],
          },
        });
      } else if (result.type === EnvironmentAlias.ServerError) {
        logger.captureError(result.error);
        dispatch({ type: SET_SERVER_FAILURE, value: true });
      }

      dispatch({ type: SET_PROGRESS, value: false });
    }
  };

  const actions = {
    Submit,
    SetFieldValue: ({ name, value }) => {
      dispatch({ type: SET_FIELD_VALUE, name, value });
    },
    SetTargetEnvironment: ({ value }) => {
      dispatch({ type: SET_TARGET_ENV, value });
    },
    CancelDialog: () => {
      onClose(false);
    },
  };

  return [state, actions];
};

/**
 * Object with validations for the different fields. The values are
 * functions that take the field value and return an error if the field
 * value is invalid.
 */
export const validations = {
  id: (value) => {
    if (!value || !value.trim()) {
      return EMPTY_FIELD_ERROR_MESSAGE;
    }

    if (value.length > MAX_ENV_ALIAS_ID_LENGTH) {
      return ENV_ALIAS_ID_TOO_LONG_ERROR_MESSAGE;
    }

    if (!isValidResourceId(value)) {
      return INVALID_ID_CHARACTER_ERROR_MESSAGE;
    }
  },
};

/**
 * Runs the validations defined above against the fields.
 *
 * Returns the fields with the errors set if any of the values is
 * invalid and returns `undefined` otherwise.
 */
function validate(fields) {
  let hasErrors = false;

  const errors = mapValues(fields, (field, name) => {
    const validateField = validations[name];
    const errorMessage = validateField(field.value);
    if (errorMessage) {
      hasErrors = true;
      return [
        {
          message: errorMessage,
        },
      ];
    } else {
      return [];
    }
  });

  if (hasErrors) {
    return errors;
  } else {
    return null;
  }
}
