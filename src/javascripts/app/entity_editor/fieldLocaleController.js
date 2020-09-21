import { isEqual } from 'lodash';
import * as K from 'core/utils/kefir';
import { createFieldLocaleDocument } from './fieldLocaleDocument';

/**
 * @ngdoc type
 * @module cf.app
 * @name FieldLocaleController
 * @description
 * Exposes field locale specific data.
 *
 * The controller is scoped to a specific locale of a specific field.
 *
 * It is exposed in the `cf_entity_field` template as
 * `$scope.fieldLocale`.
 *
 */
export const createFieldLocaleController = ({
  widget: { field },
  locale,
  otDoc,
  // Provided by the entry and asset controllers
  editorContext,
}) => {
  const controller = {};
  const fieldPath = ['fields', field.id];
  const localePath = fieldPath.concat([locale.internal_code]);

  controller.canEditLocale = otDoc.permissions.canEditFieldLocale(field.apiName, locale.code);

  controller.doc = createFieldLocaleDocument(
    otDoc,
    field,
    locale.internal_code,
    controller.canEditLocale
  );

  /**
   * @ngdoc method
   * @name FieldLocaleController#revalidate
   * @description
   * Reruns validations only for the current field locale.
   *
   * The change in errors is picked up in the `validator.errors$`
   * listener below.
   *
   * This is called by the `WidgetRenderer` directive when a field
   * editor is unfocussed.
   */
  controller.revalidate = () => {
    editorContext.validator.validateFieldLocale(field.id, locale.internal_code);
  };

  // Revalidate the current field locale after the user has stopped
  // editing for 800ms
  K.onValue(controller.doc.localChanges$.debounce(800), controller.revalidate);

  /**
   * @ngdoc property
   * @name FieldLocaleController#errors$
   * @description
   * Property that contains the array of schema errors for this field
   * locale.
   *
   * @type {Property<Error[]?>}
   */
  controller.errors$ = editorContext.validator.errors$.map((errors) => {
    errors = filterLocaleErrors(errors);
    return errors.length > 0 ? errors : null;
  });

  /**
   * @ngdoc property
   * @name FieldLocaleController#errors
   * @description
   * An array of schema errors for this field locale.
   *
   * @type {Array<Error>?}
   */
  K.onValue(controller.errors$, (errors) => {
    controller.errors = errors;
  });

  // Only retuns errors that apply to this field locale
  // TODO move this to entry validator
  function filterLocaleErrors(errors) {
    return errors.filter((error) => {
      const path = error.path;

      if (!path) {
        return false;
      }

      // If a field is required and none of field-locale pairs is provided,
      // validation library reports an error on a [fields, fid] path.
      // In this case we don't want to have a visual hint for optional locale
      if (isEqual(path, fieldPath)) {
        const fieldRequired = error.name === 'required';
        const localeOptional = locale.optional;
        return !fieldRequired || !localeOptional;
      }

      return isEqual(path.slice(0, 3), localePath);
    });
  }

  /**
   * @ngdoc property
   * @name FieldLocaleController#collaborators
   * @type {API.User[]}
   * @description
   * A list of users that are also editing this field locale.
   */
  K.onValue(controller.doc.collaborators, (collaborators) => {
    controller.collaborators = collaborators;
  });

  /**
   * @ngdoc property
   * @name FieldLocaleController#isRequired
   * @type {boolean}
   * @description
   * Holds information if a field-locale pair is required.
   *
   * See the asset schema:
   * https://github.com/contentful/contentful-validation/blob/master/lib/schemas/asset.js
   */
  controller.isRequired = field.required;
  if (
    (editorContext.entityInfo.type === 'Entry' && locale.optional) ||
    (editorContext.entityInfo.type === 'Asset' && !locale.default)
  ) {
    controller.isRequired = false;
  }

  /**
   * @ngdoc method
   * @name FieldLocaleController#setActive
   * @description
   * Tells the main document that the user is currently editing this
   * field locale.
   *
   * Used by `WidgetRenderer` component.
   *
   * @param {boolean} active
   */
  controller.setActive = (isActive) => {
    controller.doc.notifyFocus();
    if (isActive && !controller.access.disabled) {
      editorContext.focus.set(field.id);
    } else {
      editorContext.focus.unset(field.id);
    }
  };

  controller.access$ = controller.doc.access$;

  K.onValue(controller.doc.access$, (access) => {
    controller.access = access;
  });

  return controller;
};
