import { get } from 'lodash';
import { useReducer, useEffect } from 'react';
import { createImmerReducer } from 'core/utils/createImmerReducer';

export const FORM_ERROR = '__FORM_ERROR__';

const ERROR_TYPES = {
  VALIDATOR: 'validator',
  SUBMISSION: 'submission',
};

const isFormInvalid = (state) => {
  const fieldValues = Object.values(state.fields);

  const anyFieldHasErrors = fieldValues.some((field) => !!field.error);

  if (anyFieldHasErrors) {
    return true;
  }

  return false;
};

const fieldErrorMessage = (state, fieldName) => {
  const field = state.fields[fieldName];

  const emptyValidator = (value) => {
    if (!value) {
      return 'This field is required';
    }
  };

  let errorMessage = '';

  // First, run the fieldsValidator. It takes precedence over other validators
  if (state.fieldsValidator) {
    errorMessage = get(state.fieldsValidator(state.fields), fieldName, '');
  }

  if (!errorMessage && field.required) {
    errorMessage = emptyValidator(field.value);
  }

  if (!errorMessage && field.validator) {
    errorMessage = field.validator(field.value);
  }

  return errorMessage;
};

const initializeFn = (initialValues) => {
  return {
    fields: initialValues.fields,
    fieldsValidator: initialValues.fieldsValidator || (() => {}),
    form: {
      isPending: false,
      invalid: false,
      pristine: true,
      error: '',
      submissionError: false,
    },
    submitFn: initialValues.submitFn,
  };
};

const formReducer = createImmerReducer({
  UPDATE_FIELD_VALUE: (state, { payload: { fieldName, value } }) => {
    const field = state.fields[fieldName];

    field.value = value;

    state.form.pristine = false;

    // Clear the error if the errorType is submission
    // We don't know if the field is still invalid, because
    // the error came from outside of `useForm`.
    if (field.error && field.errorType === ERROR_TYPES.SUBMISSION) {
      field.error = '';
      field.errorType = null;
    }

    // We don't want to show an error if the user has just started to type, but hasn't left the field yet
    if (field.blurred) {
      const errorMessage = fieldErrorMessage(state, fieldName);

      if (errorMessage) {
        field.error = errorMessage;
        field.errorType = ERROR_TYPES.VALIDATOR;
      } else {
        field.error = '';
        field.errorType = null;
      }
    }

    // Since a submission error may have been cleared, and the field
    // may not have its own validator fn, we check to see if it's valid
    // here as well.
    state.form.invalid = isFormInvalid(state);
  },
  SET_FIELD_BLURRED: (state, { payload: { fieldName } }) => {
    const field = state.fields[fieldName];

    state.fields[fieldName].blurred = true;

    const errorMessage = fieldErrorMessage(state, fieldName);

    if (errorMessage) {
      field.error = errorMessage;
      field.errorType = ERROR_TYPES.VALIDATOR;
    } else {
      field.error = '';
      field.errorType = null;
    }

    state.form.invalid = isFormInvalid(state);
  },
  SET_FIELD_SUBMISSION_ERROR: (state, { payload: { fieldName, message } }) => {
    state.fields[fieldName].error = message;
    state.fields[fieldName].errorType = ERROR_TYPES.SUBMISSION;
    state.form.invalid = true;
  },
  SET_FORM_PENDING: (state, { payload: { isPending } }) => {
    state.form.isPending = isPending;
  },
  SET_FORM_ERROR: (state, { payload: { message } }) => {
    state.form.error = message;

    // The form is not invalid simply because of a form error. This is because
    // an API call may have just had an intermittent error, and so the form should
    // be able to submit again
  },
  SET_FORM_SUBMITTING: (state, { payload: { submitting, submitFnArgs } }) => {
    state.form.submitting = submitting;
    state.form.submitFnArgs = submitFnArgs;
  },
});

/**
 * `useForm` is a hook that handles all form related logic and UX for UI forms. Specifically,
 * it handles changes, blurs, submissions, as well as encapsulating field and form related
 * values and metadata.
 *
 * When instantiating, you must pass in a `fields` object and a `submitFn` function, and
 * optionally a `fieldsValidator` function.
 *
 * --------
 *
 * `fields`
 *
 * The keys of `fields` correspond to the name of the field, e.g. `firstName`, and the value of
 * each field given is an object that can have three keys: `value`, the default value; `validator`,
 * a validation function; and, `required`, if the field is required.
 *
 * Example fields:
 *
 * {
 *   firstName: {
 *     value: 'John',
 *     validator: (value) => {
 *       if (value !== 'John') {
 *         return 'First name must be John';
 *       }
 *     },
 *     required: true
 *   },
 *   lastName: {
 *     value: 'Smith',
 *     required: true
 *   }
 * }
 *
 * `value` is a string.
 * `validator` is a function that takes the current field value and returns either undefined,
 *     or a error message string.
 * `required` is a boolean.
 *
 * ----------
 *
 * `fieldsValidator`
 *
 * If you need additional control over the fields validation, such as a field that is dependent
 * on another field's value, you can pass in an optional `fieldsValidator` function, which takes
 * `fields` as its only argument and returns either undefined or an object of field errors (similar
 * to `submitFn`). `fieldsValidator` errors take precedence over `field.validator` errors.
 *
 * Example:
 *
 * fieldsValidator(fields) {
 *   const errors = {};
 *
 *   if (fields.firstName.value === 'John' && fields.lastName.value === 'Smith') {
 *     errors.firstName = 'Sorry, John is not a valid first name for last name Smith';
 *   }
 *
 *   return errors;
 * }
 *
 * Be aware that `fieldsValidator` is "low level" -- the normal UX that's provided by the hook
 * is overridden (for example, blurred field handling). Use `fieldsValidator` only if necessary.
 *
 * ----------
 *
 * `submitFn`
 *
 * The `submitFn` is an asynchronous function that takes the field values as an argument and
 * either returns undefined or an object that corresponds to field errors, as well as a
 * special FORM_ERROR key (exported from this file) which will then be mapped to the fields or form.
 *
 * You can also pass arbitrary arguments to `onSubmit`, which will be passed to `submitFn` after `values`.
 *
 * If an error is thrown or returned from `submitFn`, the value of `error.message` will be used as the form
 * error. Otherwise, if anything other than `undefined` is returned, the form error will be `An error occurred.`.
 *
 * Example submitFn:
 *
 * async submitFn(values, ...submitArgs) => {
 *   const spaceId = submitArgs[0];
 *
 *   try {
 *     await someAPIReq(endpoint, values);
 *   } catch (e) {
 *     const errors = {}
 *
 *     if (e.data && e.data.details) {
 *       e.data.details.forEach(detail => {
 *         if (detail.path === 'first_name') {
 *           if (detail.name === 'length') {
 *             errors.firstName = 'First name is too short'
 *           } else {
 *             errors.firstName = 'First name is invalid';
 *           }
 *         } else if (detail.path === 'last_name') {
 *           if (detail.name === 'length') {
 *             errors.firstName = 'Last name is too short'
 *           } else {
 *             errors.firstName = 'Last name is invalid';
 *           }
 *         } else {
 *           errors[FORM_ERROR] = 'An error occurred';
 *         }
 *       });
 *
 *       return errors;
 *     }
 *   }
 * }
 *
 * --------
 *
 * General usage:
 *
 *   const { onBlur, onChange, onSubmit, fields, form } = useForm({
 *     fields: { ... },
 *     submitFn: async (values, ...onSubmitArgs) => { ... },
 *     fieldsValidator: (fields) => { ... }
 *  })
 */
export function useForm(initialValues) {
  const [state, dispatch] = useReducer(formReducer, initialValues, initializeFn);

  // This effect handles if the form has been submitted
  useEffect(() => {
    async function handleSubmit(state) {
      const { submitting } = state.form;

      if (!submitting) {
        return;
      }

      if (submitting) {
        // Immediately set the submitting status to false, so that later dispatches
        // do not trigger this effect
        dispatch({ type: 'SET_FORM_SUBMITTING', payload: { submitting: false } });

        const formInvalid = isFormInvalid(state);

        if (formInvalid) {
          return;
        }

        dispatch({ type: 'SET_FORM_PENDING', payload: { isPending: true } });

        let result;

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

        try {
          const { submitFnArgs } = state.form;

          result = await state.submitFn(mappedFields, ...submitFnArgs);
        } catch (e) {
          const message = e.message;

          dispatch({
            type: 'SET_FORM_ERROR',
            payload: {
              message,
            },
          });

          dispatch({
            type: 'SET_FORM_PENDING',
            payload: {
              isPending: false,
            },
          });

          return;
        }

        if (result !== undefined) {
          // If the result is not `undefined`, but the result has no keys, then
          // something seems to be wrong (the result is not formatted correctly).
          if (Object.keys(result).length === 0) {
            dispatch({
              type: 'SET_FORM_ERROR',
              payload: {
                message: 'An error occurred.',
              },
            });
          } else {
            const formError = get(result, FORM_ERROR, '');

            if (formError !== '') {
              dispatch({
                type: 'SET_FORM_ERROR',
                payload: {
                  message: formError,
                },
              });
            }

            Object.entries(result).forEach(([fieldName, message]) => {
              // Ignore errors that don't correspond to a field
              if (!state.fields[fieldName]) {
                return;
              }

              dispatch({
                type: 'SET_FIELD_SUBMISSION_ERROR',
                payload: {
                  fieldName,
                  message,
                },
              });
            });
          }
        }

        dispatch({
          type: 'SET_FORM_PENDING',
          payload: {
            isPending: false,
          },
        });
      }
    }

    handleSubmit(state);
  }, [state]);

  const onBlur = (fieldName) => {
    dispatch({ type: 'SET_FIELD_BLURRED', payload: { fieldName } });
  };

  const onChange = (fieldName, value) => {
    // Always update the field value
    dispatch({ type: 'UPDATE_FIELD_VALUE', payload: { fieldName, value } });
  };

  const onSubmit = async (...submitFnArgs) => {
    // Blur all fields manually, in case some haven't been touched but are required or
    // have another validator on them
    for (const fieldName in state.fields) {
      onBlur(fieldName);
    }

    // This triggers the effect above
    dispatch({
      type: 'SET_FORM_SUBMITTING',
      payload: {
        submitting: true,
        submitFnArgs,
      },
    });
  };

  return {
    onBlur,
    onChange,
    onSubmit,
    fields: state.fields,
    form: state.form,
  };
}
