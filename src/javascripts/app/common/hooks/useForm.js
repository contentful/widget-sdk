import { get } from 'lodash';
import { useReducer } from 'react';
import { createImmerReducer } from 'redux/utils/createImmerReducer';

/*
  useForm: A hook for handling form data and submission.

  Usage:
    function myComponent() {
      const { onBlur, onChange, onSubmit, fields, form } = useForm({
        fields: {
          name: {
            value: 'John',
            validator: value => {
              if (name !== 'John') {
                return 'First name must be John';
              }
            }
          },
          lastName: {
            value: 'Smith'
          },
          email: {
            value: 'john.smith@localhost.dev'
          }
        },
        submitFn: async fields => {
          // fields: {
          //   firstName: 'John',
          //   lastName: 'Smith',
          //   email: 'john.smith@localhost.dev'
          // }


          await submitData(fields);
        }
      })
    }

 */

const initializeFn = initialValues => {
  return {
    fields: initialValues.fields,
    form: {
      isPending: false,
      invalid: false,
      pristine: true,
      error: ''
    },
    onSubmit: initialValues.onSubmit
  };
};

const formReducer = createImmerReducer({
  UPDATE_FIELD_VALUE: (state, { payload }) => {
    state.fields[payload.fieldName].value = payload.value;

    // TODO: maybe have to separate out submission and non-submission related errors
    state.fields[payload.fieldName].error = null;

    state.form.invalid = false;
    state.form.pristine = false;
  },
  SET_FIELD_BLURRED: (state, { payload: { fieldName } }) => {
    state.fields[fieldName].blurred = true;
  },
  SET_FIELD_ERROR: (state, { payload: { fieldName, message } }) => {
    if (message !== '') {
      state.form.invalid = true;
    } else {
      state.form.invalid = false;
    }

    state.fields[fieldName].error = message;
  },
  SET_FORM_PENDING: (state, { payload: { isPending } }) => {
    state.form.isPending = isPending;
  },
  SET_FORM_ERROR: (state, { payload: { message } }) => {
    state.form.error = message;
  }
});

const runValidator = (validator, fieldName, value, dispatch) => {
  const errorMessage = validator(value);

  if (errorMessage) {
    dispatch({ type: 'SET_FIELD_ERROR', payload: { fieldName, message: errorMessage } });
  } else {
    dispatch({ type: 'SET_FIELD_ERROR', payload: { fieldName, message: null } });
  }
};

export default function useForm(initialValues) {
  const [state, dispatch] = useReducer(formReducer, initialValues, initializeFn);

  // onBlur sets the field as blurred
  // onChange updates the field value

  const onBlur = fieldName => {
    dispatch({ type: 'SET_FIELD_BLURRED', payload: { fieldName } });

    const { validator, value } = state.fields[fieldName];

    // Run the validator, and if it fails, set an error
    if (validator) {
      runValidator(validator, fieldName, value, dispatch);
    }
  };

  const onChange = (fieldName, value) => {
    // Always update the field value
    dispatch({ type: 'UPDATE_FIELD_VALUE', payload: { fieldName, value } });

    const { blurred, validator } = state.fields[fieldName];

    if (blurred && validator) {
      runValidator(validator, fieldName, value, dispatch);
    }
  };

  const onSubmit = async () => {
    // Go through each field, run onBlur for each field, and if there are any errors, do not run the
    // given onSubmit handler
    for (const fieldName in state.fields) {
      onBlur(fieldName);
    }

    if (!Object.values(state.fields).find(field => field.error)) {
      dispatch({ type: 'SET_FORM_PENDING', payload: { isPending: true } });

      try {
        // Create a mapping of fieldNames and values
        //
        // E.g.
        // {
        //   firstName: 'John',
        //   lastName: 'Smith'
        // }
        const mappedFields = Object.entries(state.fields).reduce((memo, [fieldName, { value }]) => {
          memo[fieldName] = value;

          return memo;
        }, {});

        const result = await state.submitFn(mappedFields);

        if (result) {
          const formError = get(result, 'form', '');
          const fieldErrors = get(result, 'fields', {});

          if (formError !== '') {
            dispatch({
              type: 'SET_FORM_ERROR',
              payload: {
                message: formError
              }
            });
          }

          Object.entries(fieldErrors).forEach(([fieldName, message]) => {
            dispatch({
              type: 'SET_FIELD_ERROR',
              payload: {
                fieldName,
                message
              }
            });
          });
        }

        dispatch({
          type: 'SET_FORM_PENDING',
          payload: {
            isPending: false
          }
        });
      } catch (e) {
        dispatch({
          type: 'SET_FORM_ERROR',
          payload: {
            message: 'An error occurred. Try again.'
          }
        });

        dispatch({
          type: 'SET_FORM_PENDING',
          payload: {
            isPending: false
          }
        });
      }
    }
  };

  return {
    onBlur,
    onChange,
    onSubmit,
    fields: state.fields,
    form: state.form
  };
}
