'use strict';

/**
 * @ngdoc directive
 * @name cfWidgetApi
 *
 * @description
 * Provides an interface similar to the new widget api.
 *
 * @scope.requires {object} entity
 * @scope.requires {object} locale
 * @scope.requires {object} otSubDoc
 * @scope.requires {object} fields
 * @scope.requires {object} transformedContentTypeData
 * @scope.requires {object} widget
 * @scope.requires {object} fieldController
 * @scope.requires {object} state
 */
angular.module('contentful')
.directive('cfWidgetApi', [() => ({
  restrict: 'A',
  controller: 'WidgetApiController'
})])

/**
 * @ngdoc type
 * @name WidgetApiController
 * @description
 * Interface for a widget to communicate with an entry.
 *
 * Exposed by the `cfWidgetApi` directive.
 */
.controller('WidgetApiController', ['$scope', 'require', function ($scope, require) {
  var TheLocaleStore = require('TheLocaleStore');
  var K = require('utils/kefir');
  var spaceContext = require('spaceContext');
  var EntityHelpers = require('EntityHelpers');
  var Navigator = require('states/Navigator');

  var fieldLocale = $scope.fieldLocale;
  var ctField = $scope.widget.field;

  var isEditingDisabled = fieldLocale.access$.map(access => {
    return !!access.disabled;
  });

  this.settings = _.clone($scope.widget.settings);
  this.settings.helpText = this.settings.helpText || $scope.widget.defaultHelpText;

  this.locales = {
    default: getDefaultLocaleCode(),
    available: getAvailableLocaleCodes()
  };

  this.contentType = $scope.transformedContentTypeData;

  // Collection of APIs that are not exposed by the extensions API.
  this._internal = {};
  if ($scope.editorContext.editReferences) {
    this._internal.editReferences = (index, cb) => {
      $scope.editorContext.editReferences(ctField.id, $scope.locale.internal_code, index, cb);
    };
  }

  // TODO: This is used to create multiple reference contexts
  // to be able to open multiple instances of the bulk editor
  // simultaneously.
  if ($scope.editorContext.createReferenceContext) {
    this._internal.createReferenceContext = (index, cb) => $scope.editorContext.createReferenceContext(ctField.id, $scope.locale.internal_code, index, cb);
  }

  if ($scope.editorContext.toggleSlideinEditor) {
    this._internal.toggleSlideinEditor = $scope.editorContext.toggleSlideinEditor;
  }

  this.entry = {
    // TODO only used by slug and reference editor; we should
    // remove it and only offer a property interface
    getSys: function () {
      return K.getValue(fieldLocale.doc.sys);
    },
    onSysChanged: function (cb) {
      return K.onValueScope($scope, fieldLocale.doc.sys, cb);
    },
    fields: $scope.fields // comes from entry editor controller
  };

  this.space = spaceContext.cma;
  this.entityHelpers = EntityHelpers.newForLocale($scope.locale.code);
  this.state = {
    goToEditor: function (entity) {
      var ref = Navigator.makeEntityRef(entity);
      return Navigator.go(ref);
    }
  };

  // This interace is not exposed on the Extensions SDK. It serves for
  // internal convenience. Everything that uses these values can be
  // written (albeit akwardly) with the Extensions SDK.
  this.fieldProperties = {
    // Property<boolean>
    isDisabled$: isEditingDisabled,
    // Property<Error[]?>
    schemaErrors$: fieldLocale.errors$,
    // Property<any>
    value$: fieldLocale.doc.value$
  };

  this.field = {
    onIsDisabledChanged: function (cb) {
      return K.onValueScope($scope, isEditingDisabled, cb);
    },
    onPermissionChanged: function (cb) {
      return K.onValueScope($scope, fieldLocale.access$, cb);
    },
    onSchemaErrorsChanged: function (cb) {
      return K.onValueScope($scope, fieldLocale.errors$, cb);
    },
    setInvalid: setInvalid,
    onValueChanged: function (cb) {
      return K.onValueScope($scope, fieldLocale.doc.valueProperty, cb);
    },
    getValue: fieldLocale.doc.get,
    setValue: fieldLocale.doc.set,
    removeValue: fieldLocale.doc.remove,
    removeValueAt: fieldLocale.doc.removeAt,
    insertValue: fieldLocale.doc.insert,
    pushValue: fieldLocale.doc.push,

    id: ctField.apiName, // we only want to expose the public ID
    name: ctField.name,
    locale: $scope.locale.code,
    type: ctField.type,
    linkType: ctField.linkType,
    itemLinkType: _.get(ctField, ['items', 'linkType']),
    required: !!ctField.required,
    validations: ctField.validations || [],
    itemValidations: _.get(ctField, ['items', 'validations'], []),

    registerPublicationWarning: $scope.state.registerPublicationWarning,

    // Convenience properties not provided by the extensions API but
    // easily emulated.
    value$: fieldLocale.doc.value$
  };

  /**
   * @ngdoc method
   * @name WidgetApiController#field.setInvalid
   * @description
   * Set to true to indicate that the user input is invalid.
   *
   * If true this will set the field state to invalid and show a red side
   * border.
   *
   * @param {boolean} isInvalid
   */
  function setInvalid (isInvalid) {
    $scope.fieldController.setInvalid($scope.locale.code, isInvalid);
  }

  function getDefaultLocaleCode () {
    return TheLocaleStore.getDefaultLocale().code;
  }

  function getAvailableLocaleCodes () {
    return _.map(TheLocaleStore.getPrivateLocales(), 'code');
  }
}]);
