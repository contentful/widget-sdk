/**
 * @ngdoc service
 * @name entityEditor/Validator
 * @description
 * Factory to construct a validator for the EntryEditorController and
 * AssetEditorController.
 */

import * as K from 'utils/kefir';
import * as Path from 'utils/Path';
import {
  constant, noop, isEmpty,
  filter, assign, get as getAtPath
} from 'lodash';

/**
 * @ngdoc method
 * @name entityEditor/Validator#createNoop
 * @description
 * This is used by the 'SnapshotComparatorController' to mock the
 * editorContext interface to the field editors.
 *
 * @returns {entityEditor/Validator}
 */
export function createNoop () {
  return {
    errors$: K.constant([]),
    run: constant(true),
    hasFieldError: constant(false),
    hasFieldLocaleError: constant(false),
    setApiResponseErrors: noop
  };
}


/**
 * @ngdoc method
 * @name entityEditor/Validator#create
 * @param {function(error): string} buildMessage
 * @param {object} schema
 *   A '@contentful/validation' schema
 * @param {function(): object} getData
 *   Function that returns the entity data we want to validate
 * @returns {entityEditor/Validator}
 */
export function create (buildMessage, schema, getData) {
  let currentErrors = [];
  const errorsBus = K.createPropertyBus(currentErrors);

  /**
   * @ngdoc type
   * @name entityEditor/Validator
   * @description
   */
  return {
    /**
     * @ngdoc property
     * @name entityEditor/Validator#errors$
     * @description
     * Contains the errors from the most recent validations run.
     *
     * The property is updated when either `run()` or `setErrors()`
     * are called.
     *
     * @type {Property<Error[]>}
     */
    errors$: errorsBus.property,
    run: run,
    hasFieldError: hasFieldError,
    hasFieldLocaleError: hasFieldLocaleError,
    setApiResponseErrors: setApiResponseErrors
  };

  /**
   * @ngdoc property
   * @name entityEditor/Validator#hasFieldError
   * @description
   * Returns true iff there is an error for the given field.
   *
   * @param {string} fieldId  internal field id
   * @return {boolean}
   */
  function hasFieldError (fieldId) {
    return currentErrors.some(function (error) {
      return Path.isPrefix(['fields', fieldId], error.path);
    });
  }

  /**
   * @ngdoc property
   * @name entityEditor/Validator#hasFieldLocale
   * @description
   * Returns true iff there is an error for the given field and
   * locale.
   *
   * @param {string} fieldId  internal field id
   * @param {string} localeCode  internal locale code
   * @return {boolean}
   */
  function hasFieldLocaleError (fieldId, localeCode) {
    return currentErrors.some(function (error) {
      return Path.isPrefix(['fields', fieldId, localeCode], error.path);
    });
  }

  /**
   * @ngdoc property
   * @name entityEditor/Validator#run
   * @description
   * Run the schema validation against the current data. Returns
   * `true` if the validation was successful and `false` otherwise.
   *
   * @return {boolean}
   */
  function run () {
    setErrors(schema.errors(getData(), {skipDeletedLocaleFieldValidation: true}));
    return isEmpty(currentErrors);
  }

  /**
   * @ngdoc property
   * @name entityEditor/Validator#apiResponseErrors
   * @description
   * Sets the list of errors and updates the `errors$` property.
   *
   * Normalizes the list of errors and add error messages for humans.
   *
   * @param {Error[]} errors
   */
  function setApiResponseErrors (response) {
    const data = response.data || {};
    const errorId = getAtPath(data, ['sys', 'id']);
    const isValidationError =
      errorId === 'ValidationFailed' ||
      // Entity link points to non-existent entity
      errorId === 'UnresolvedLinks' ||
      // Linked entry does not have the correct content type
      (errorId === 'InvalidEntry' && data.message === 'Validation error');

    if (isValidationError) {
      const errors = getAtPath(data, ['details', 'errors'], []);
      setErrors(errors);
    }
  }

  function setErrors (errors) {
    errors = filter(errors, function (error) {
      return error && error.path;
    });

    errors = errors.map(function (error) {
      // TODO we should freeze this but duplicate errors modify this.
      return assign({
        path: []
      }, error, {
        message: buildMessage(error)
      });
    });

    currentErrors = errors;
    errorsBus.set(errors);

    return errors;
  }
}
