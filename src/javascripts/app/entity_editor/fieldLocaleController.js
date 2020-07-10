import { registerController } from 'core/NgRegistry';
import { isEqual } from 'lodash';
import * as K from 'core/utils/kefir';
import createFieldLocaleDoc from 'app/entity_editor/FieldLocaleDocument';
import DocumentStatusCode from 'data/document/statusCode';
import { statusProperty } from './Document';
import { FieldAccess } from './EntityField/EntityFieldAccess';

export default function register() {
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
   * @scope.requires {API.Locale} locale
   * @scope.requires {Widget.Renderable} widget
   */
  registerController('FieldLocaleController', [
    '$scope',
    function FieldLocaleController($scope) {
      const controller = this;
      const field = $scope.widget.field;
      const locale = $scope.locale;
      const fieldPath = ['fields', field.id];
      const localePath = fieldPath.concat([locale.internal_code]);

      controller.doc = createFieldLocaleDoc($scope.otDoc, field.id, locale.internal_code);

      // Provided by the entry and asset controllers
      const editorContext = $scope.editorContext;

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
        $scope.editorContext.validator.validateFieldLocale(field.id, locale.internal_code);
      };

      // Revalidate the current field locale after the user has stopped
      // editing for 800ms
      K.onValueScope($scope, controller.doc.localChanges$.debounce(800), controller.revalidate);

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
      K.onValueScope($scope, controller.errors$, (errors) => {
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
            const localeOptional = $scope.locale.optional;
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
      K.onValueScope($scope, controller.doc.collaborators, (collaborators) => {
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

      const canEditLocale = $scope.otDoc.permissions.canEditFieldLocale(field.apiName, locale.code);
      $scope.canEditLocale = canEditLocale;

      const documentStatus$ = statusProperty($scope.otDoc) || K.constant();

      /**
       * @ngdoc property
       * @name FieldLocaleController#access$
       * @type {Property<Access>}
       * @description
       * Holds information about the access to the current field locale.
       *
       * The object has a number of boolean properties that are set
       * according to the connection state and editing permissions.
       *
       * - `disconnected` No ShareJS connection
       * - `denied` The user does not have permission to edit the field
       * - `editing_disabled` The field is disabled at the content type level
       * - `disabled` Is true if one of the above is true
       * - `editable` Is true if 'disabled' is false
       */
      controller.access$ =
        // TODO move this to FieldLocaleDocument
        K.combine(
          [documentStatus$, $scope.otDoc.state.isConnected$, controller.doc.collaborators],
          (status, isConnected, collaborators) => {
            if (field.disabled) {
              return FieldAccess.EDITING_DISABLED;
            } else if (!canEditLocale) {
              return FieldAccess.DENIED;
            } else if (
              isCollaborativeEditingDisabledForFieldType(field.type) &&
              collaborators &&
              collaborators.length > 0
            ) {
              return FieldAccess.OCCUPIED;
            } else if (isConnected) {
              // CmaDocument is always "connected" by design (unless internet down)
              // so we need to be more granular than in case of `OtDocument`.
              return [
                DocumentStatusCode.INTERNAL_SERVER_ERROR,
                DocumentStatusCode.EDIT_CONFLICT,
                DocumentStatusCode.ARCHIVED,
                DocumentStatusCode.DELETED,
                DocumentStatusCode.CONNECTION_ERROR,
              ].includes(status)
                ? FieldAccess.DISCONNECTED
                : FieldAccess.EDITABLE;
            } else {
              return FieldAccess.DISCONNECTED;
            }
          }
        ).toProperty();

      K.onValueScope($scope, controller.access$, (access) => {
        controller.access = access;
      });

      function isCollaborativeEditingDisabledForFieldType(fieldType) {
        return fieldType === 'RichText';
      }
    },
  ]);
}
