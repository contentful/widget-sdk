'use strict';

/**
 * @ngdoc directive
 * @name cfWidgetApi
 *
 * @description
 * Provides an interface similar to the new widget api.
 *
 * @scope.requires {object} entry
 * @scope.requires {object} locale
 * @scope.requires {object} otSubDoc
 * @scope.requires {object} fields
 * @scope.requires {object} transformedContentTypeData
 * @scope.requires {object} widget
 * @scope.requires {object} fieldController
 * @scope.requires {object} state
 */
angular.module('contentful')
.directive('cfWidgetApi', [function () {
  return {
    restrict: 'A',
    controller: 'WidgetApiController'
  };
}])

/**
 * @ngdoc type
 * @name WidgetApiController
 * @description
 * Interface for a widget to communicate with an entry.
 *
 * Exposed by the `cfWidgetApi` directive.
 */
.controller('WidgetApiController', ['$scope', '$injector', function ($scope, $injector) {
  var newSignal = $injector.get('signal').createMemoized;
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var K = $injector.get('utils/kefir');
  var spaceContext = $injector.get('spaceContext');
  var EntityHelpers = $injector.get('EntityHelpers');
  var goToEntityEditor = $injector.get('goToEntityEditor');

  var fieldLocale = $scope.fieldLocale;
  var isDisabledSignal = newSignal(isEditingDisabled());
  var schemaErrorsSignal = newSignal(null);
  var ctField = $scope.widget.field;

  $scope.$watch(isEditingDisabled, function (value) {
    // Do not send other listener arguments to signal
    isDisabledSignal.dispatch(value);
  });

  $scope.$watch('fieldLocale.errors', function (errors) {
    schemaErrorsSignal.dispatch(errors);
  });

  // TODO: consolidate entity data at one place instead of
  // splitting it across a sharejs doc as well as global
  // entity data
  var sysChangedSignal = newSignal($scope.entity.data.sys);
  $scope.$watch('entity.data.sys', function (sys) {
    sysChangedSignal.dispatch(sys);
  });

  this.settings = $scope.widget.settings;
  this.settings.helpText = this.settings.helpText || $scope.widget.defaultHelpText;

  this.locales = {
    default: getDefaultLocaleCode(),
    available: getAvailableLocaleCodes()
  };

  this.contentType = $scope.transformedContentTypeData;

  this.entry = {
    getSys: function () {
      return $scope.entity.data.sys;
    },
    onSysChanged: sysChangedSignal.attach,
    fields: $scope.fields // comes from entry editor controller
  };

  this.space = spaceContext.cma;
  this.entityHelpers = EntityHelpers.newForLocale($scope.locale.code);
  this.state = {goToEditor: goToEntityEditor};

  this.field = {
    onDisabledStatusChanged: isDisabledSignal.attach,
    onSchemaErrorsChanged: schemaErrorsSignal.attach,
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
    itemLinkType: dotty.get(ctField, ['items', 'linkType']),
    required: !!ctField.required,
    validations: ctField.validations || [],
    itemValidations: dotty.get(ctField, ['items', 'validations'], []),

    registerPublicationWarning: $scope.state.registerPublicationWarning
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
  };

  function isEditingDisabled () {
    return fieldLocale.access.disabled;
  }

  function getDefaultLocaleCode () {
    return TheLocaleStore.getDefaultLocale().code;
  }

  function getAvailableLocaleCodes () {
    return _.map(TheLocaleStore.getPrivateLocales(), 'code');
  }
}]);
