'use strict';

angular.module('contentful')
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
 * @scope.requires {API.Field} field
 * @scope.requires validationResult
 * @scope.requires docPresence
 */
.controller('FieldLocaleController', ['require', '$scope', function (require, $scope) {
  var K = require('utils/kefir');
  var policyAccessChecker = require('accessChecker/policy');
  var FieldLocaleDoc = require('entityEditor/FieldLocaleDocument');

  var controller = this;
  var field = $scope.field;
  var locale = $scope.locale;
  var fieldPath = ['fields', field.id];
  var localePath = fieldPath.concat([locale.internal_code]);

  // Values for controller.access
  var DENIED = {denied: true, disabled: true};
  var EDITING_DISABLED = {editing_disabled: true, disabled: true};
  var EDITABLE = {editable: true};
  var DISCONNECTED = {disconnected: true, disabled: true};

  controller.doc = FieldLocaleDoc.create($scope.otDoc, field.id, locale.internal_code);

  /**
   * @ngdoc property
   * @name FieldLocaleController#errors$
   * @description
   * Property that contains the array of schema errors for this field
   * locale.
   *
   * @type {Property<Error[]?>}
   */
  controller.errors$ =
    $scope.validator.errors$
    .map(function (errors) {
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
  K.onValueScope($scope, controller.errors$, function (errors) {
    controller.errors = errors;
  });

  // Only retuns errors that apply to this field locale
  function filterLocaleErrors (errors) {
    return _.filter(errors, function (error) {
      var path = error.path;

      // If a field is required and none of field-locale pairs is provided,
      // validation library reports an error on a [fields, fid] path.
      // In this case we don't want to have a visual hint for optional locale
      if (_.isEqual(path, fieldPath)) {
        var fieldRequired = error.name === 'required';
        var localeOptional = $scope.locale.optional;
        return !fieldRequired || !localeOptional;
      }

      return _.isEqual(path.slice(0, 3), localePath);
    });
  }

  /**
   * @ngdoc property
   * @name FieldLocaleController#collaborators
   * @type {API.User[]}
   * @description
   * A list of users that are also editing this field locale.
   */
  K.onValueScope($scope, controller.doc.collaborators, function (collaborators) {
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
  if (($scope.entry && locale.optional) || ($scope.asset && !locale.default)) {
    controller.isRequired = false;
  }

  /**
   * @ngdoc method
   * @name FieldLocaleController#setActive
   * @description
   * Tells the main document that the user is currently editing this
   * field locale.
   *
   * Used by `cfWidgetRenderer` directive.
   *
   * @param {boolean} active
   */
  controller.setActive = function (isActive) {
    if (isActive) {
      controller.doc.notifyFocus();
      $scope.focus.set(field.id);
    } else {
      $scope.focus.unset(field.id);
    }
  };

  /**
   * @ngdoc property
   * @name FieldLocaleController#access
   * @type {object}
   * @description
   * Information about the access to the current field locale.
   *
   * The object has a number of boolean properties that are set
   * according to the connection state and editing permissions. See
   * below for a description of the properties.
   */
  /**
   * @ngdoc property
   * @name FieldLocaleController#access.disabled
   * @type {boolean}
   * @description
   * True if there is no connction to ShareJS or if the user does not
   * have permissions to the edit the field locale.
   */
  /**
   * @ngdoc property
   * @name FieldLocaleController#access.editing_disabled
   * @type {boolean}
   * @description
   * True if the field is disabled on a content type level.
   *
   * Implies `access.disabled === true`.
   */
  /**
   * @ngdoc property
   * @name FieldLocaleController#access.denied
   * @type {boolean}
   * @description
   * True if the user does not have permissions to the edit the field
   * locale.
   *
   * Implies `access.disabled === true`.
   */
  /**
   * @ngdoc property
   * @name FieldLocaleController#access.disconnected
   * @type {boolean}
   * @description
   * True if there is no connction to ShareJS.
   *
   * Implies `access.disabled === true`.
   */
  controller.access = DISCONNECTED;
  $scope.$watchGroup(['otDoc.state.editable', hasEditingPermission], function (access) {
    var docOpen = access[0];
    var editingAllowed = access[1];
    if (field.disabled) {
      controller.access = EDITING_DISABLED;
    } else if (!editingAllowed) {
      controller.access = DENIED;
    } else if (docOpen) {
      controller.access = EDITABLE;
    } else {
      controller.access = DISCONNECTED;
    }
  });

  function hasEditingPermission () {
    var ctId = dotty.get($scope, 'entity.data.sys.contentType.sys.id');
    return policyAccessChecker.canEditFieldLocale(ctId, field, locale);
  }
}]);
