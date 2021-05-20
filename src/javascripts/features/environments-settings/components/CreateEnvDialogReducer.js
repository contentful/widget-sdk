import { useReducer } from 'react';
import { createImmerReducer } from 'core/utils/createImmerReducer';
import { mapValues, get } from 'lodash';
import { isValidResourceId } from 'data/utils';
import * as Environment from 'data/CMA/SpaceEnvironmentsRepo';
import { captureError } from 'core/monitoring';

const MAX_ENV_ID_LENGTH = 40;

const DUPLICATE_ID_ERROR_MESSAGE =
  'An environment or alias with the same ID already exists in your space. Make sure to use a unique ID.';
const INVALID_ID_CHARACTER_ERROR_MESSAGE =
  'Please use only letters, numbers, underscores, dashes and dots for the ID.';
const EMPTY_FIELD_ERROR_MESSAGE = 'Please fill out this field.';
const ENV_ID_TOO_LONG_ERROR_MESSAGE = `Please provide an ID that has ${MAX_ENV_ID_LENGTH} characters or less.`;

/**
 * Actions
 */

const SET_FIELD_VALUE = 'SET_FIELD_VALUE';
const SET_SOURCE_ENV = 'SET_SOURCE_ENV';
const SET_ERRORS = 'SUBMIT';
const SET_PROGRESS = 'SET_PROGRESS';
const SET_SERVER_FAILURE = 'SET_SERVER_FAILURE';

/**
 * Reducer
 */

const createEnvReducer = createImmerReducer({
  [SET_FIELD_VALUE]: (state, { name, value }) => {
    state.fields[name].value = value;
    state.fields[name].errors = [];
  },
  [SET_SOURCE_ENV]: (state, { value }) => {
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

export const useCreateEnvState = (props) => {
  const {
    environments,
    currentEnvironment,
    canSelectSource,
    createEnvironment,
    onClose,
    onCreate,
  } = props;

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
    // If you cannot select the source environment, pick `master` as selected because that's the only source you can use
    selectedEnvironment: canSelectSource ? currentEnvironment : 'master',
    canSelectSource,
    inProgress: false,
    maxIdLength: MAX_ENV_ID_LENGTH,
  };

  const [state, dispatch] = useReducer(createEnvReducer, initialState);

  const Submit = async () => {
    const errors = validate(state);
    if (errors) {
      dispatch({ type: SET_ERRORS, errors });
    } else {
      dispatch({ type: SET_PROGRESS, value: true });
      const id = get(state, ['fields', 'id', 'value']);
      const result = await createEnvironment({
        id,
        name: id,
        source: state.selectedEnvironment,
      });

      if (result.type === Environment.EnvironmentUpdated) {
        onCreate(true);
      } else if (result.type === Environment.IdExistsError) {
        dispatch({
          type: SET_ERRORS,
          errors: {
            id: [
              {
                message: DUPLICATE_ID_ERROR_MESSAGE,
              },
            ],
          },
        });
      } else if (result.type === Environment.ServerError) {
        captureError(result.error);
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
    SetSourceEnvironment: ({ value }) => {
      dispatch({ type: SET_SOURCE_ENV, value });
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
const validations = {
  id: (value, state) => {
    if (!value || !value.trim()) {
      return EMPTY_FIELD_ERROR_MESSAGE;
    }

    if (value.length > MAX_ENV_ID_LENGTH) {
      return ENV_ID_TOO_LONG_ERROR_MESSAGE;
    }

    if (!isValidResourceId(value)) {
      return INVALID_ID_CHARACTER_ERROR_MESSAGE;
    }

    if (state?.environments?.some(({ id }) => id === value)) {
      return DUPLICATE_ID_ERROR_MESSAGE;
    }
  },
};

/**
 * Runs the validations defined above against the fields.
 *
 * Returns the fields with the errors set if any of the values is
 * invalid and returns `undefined` otherwise.
 */
function validate(state) {
  const { fields } = state;
  let hasErrors = false;

  const errors = mapValues(fields, (field, name) => {
    const validateField = validations[name];
    const errorMessage = validateField(field.value, state);
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
