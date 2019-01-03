/**
 * @ngdoc service
 * @name entityEditor/Validator
 * @description
 * This module exports factories to construct 'Validator' objects used
 * by the EntryEditorController and AssetEditorController.
 *
 * A validator holds the current validation errors for an entity and
 * exposes the following API:
 * - `run()` Validates entity data against schema and updates errors
 * - `setApiResponseErrors` Set the current errors from an API response
 * - `errors$`, `hasFieldError()`, `hasFieldLocaleError()` Accessors
 *   for information on current errors
 */

import { constant, noop, isEmpty, assign, get as getAtPath, isEqual } from 'lodash';
import * as K from 'utils/kefir.es6';
import * as Path from 'utils/Path.es6';
import * as Schema from '@contentful/validation';
import { getModule } from 'NgRegistry.es6';

const errorMessageBuilder = getModule('errorMessageBuilder');

/**
 * @ngdoc method
 * @name entityEditor/Validator#createNoop
 * @description
 * This is used by the 'SnapshotComparatorController' to mock the
 * editorContext interface to the field editors.
 *
 * @returns {entityEditor/Validator}
 */
export function createNoop() {
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
 * @name entityEditor/Validator#createForEntry
 * @param {API.ContentType} contentType
 * @param {EntityEditor.Document} doc
 * @param {ContentTypeRepo} publishedCTs
 * @param {API.Locale[]} locales
 * @returns {entityEditor/Validator}
 */
export function createForEntry(contentType, doc, publishedCTs, locales) {
  const schema = Schema.fromContentType(contentType, locales);
  const buildMessage = errorMessageBuilder(publishedCTs);
  return createBase(buildMessage, schema, doc);
}

/**
 * @ngdoc method
 * @name entityEditor/Validator#createForAsset
 * @param {API.ContentType} contentType
 * @param {EntityEditor.Document} doc
 * @param {ContentTypeRepo} publishedCTs
 * @param {API.Locale[]} locales
 * @returns {entityEditor/Validator}
 */
export function createForAsset(doc, locales) {
  const schema = Schema.schemas.Asset(locales);
  const buildMessage = errorMessageBuilder.forAsset;
  return createBase(buildMessage, schema, doc);
}

// Only exported for tests
export function createBase(buildMessage, schema, doc) {
  const errorsBus = K.createPropertyBus([]);
  const errors$ = errorsBus.property;

  // We do not run validations for newly created documents
  // Newly created documents have version number 2 because version one
  // is the create event and version 2 is the normalization that takes
  // place in the UI and is not caused by the user. See the
  // 'data/document_normalizer' module.
  if (doc.getVersion() > 2) {
    run();
  }

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
    errors$,
    run,
    validateFieldLocale,
    hasFieldError,
    hasFieldLocaleError,
    setApiResponseErrors
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
  function hasFieldError(fieldId) {
    return K.getValue(errors$).some(error => Path.isPrefix(['fields', fieldId], error.path));
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
  function hasFieldLocaleError(fieldId, localeCode) {
    return K.getValue(errors$).some(error =>
      Path.isPrefix(['fields', fieldId, localeCode], error.path)
    );
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
  function run() {
    const errors = validate();
    errorsBus.set(errors);
    return isEmpty(errors);
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
  function setApiResponseErrors(response) {
    const data = response.data || {};
    const errorId = getAtPath(data, ['sys', 'id']);
    const isValidationError =
      errorId === 'ValidationFailed' ||
      // Entity link points to non-existent entity
      errorId === 'UnresolvedLinks' ||
      // Linked entry does not have the correct content type
      (errorId === 'InvalidEntry' && data.message === 'Validation error');

    if (isValidationError) {
      const rawErrors = getAtPath(data, ['details', 'errors'], []);
      const errors = processErrors(rawErrors);
      errorsBus.set(errors);
    }
  }

  /**
   * @ngdoc property
   * @name entityEditor/Validator#validateFieldLocale
   * @description
   * Reruns validation only for given field and locale.
   *
   * This means that we remove all old errors for this field and locale
   * validate the data and add only the errors for this field and
   * locale. We keep the errors for all other fields and locales.
   *
   * @param {string} fieldId  internal field id
   * @param {string} localeCode  internal locale code
   */
  function validateFieldLocale(fieldId, localeCode) {
    const errors = validate();
    const fieldErrors = errors.filter(error =>
      Path.isPrefix(['fields', fieldId, localeCode], error.path)
    );
    const otherErrors = K.getValue(errors$).filter(error => {
      return (
        !Path.isPrefix(['fields', fieldId, localeCode], error.path) &&
        !isEqual(['fields', fieldId], error.path)
      );
    });
    const newErrors = fieldErrors.concat(otherErrors);
    errorsBus.set(newErrors);
  }

  /**
   * Run validations fro the current entity data and return the
   * processed errors.
   */
  function validate() {
    const entityData = K.getValue(doc.data$);
    const rawErrors = schema.errors(entityData, { skipDeletedLocaleFieldValidation: true });
    return processErrors(rawErrors);
  }

  /**
   * Filter invalid error objects and add user facing error messages
   *
   * This function is applied to errors coming from the validation
   * library or API responses.
   */
  function processErrors(errors) {
    return errors
      .filter(error => error && error.path)
      .map((
        error // TODO we should freeze this but duplicate errors modify this.
      ) =>
        assign({}, error, {
          message: buildMessage(error)
        })
      );
  }
}
