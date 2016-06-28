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
  var $state = $injector.get('$state');
  var newSignal = $injector.get('signal').createMemoized;
  var TheLocaleStore = $injector.get('TheLocaleStore');
  var spaceContext = $injector.get('spaceContext');
  var EntityHelpers = $injector.get('EntityHelpers');

  var fieldLocaleDoc = $scope.otSubDoc;
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
  this.entityHelpers = EntityHelpers.forLocale($scope.locale.code);

  this.state = {
    goToEditor: function (linkOrData) {
      var type = dotty.get(linkOrData, 'sys.linkType', dotty.get(linkOrData, 'sys.type'));
      var typePlural = {Entry: 'entries', Asset: 'assets'}[type];
      var path = 'spaces.detail.' + typePlural + '.detail';

      var options = {addToContext: true};
      var entityIdKey = type.toLowerCase() + 'Id';
      options[entityIdKey] = dotty.get(linkOrData, 'sys.id');

      return $state.go(path, options);
    }
  };

  this.field = {
    onDisabledStatusChanged: isDisabledSignal.attach,
    onSchemaErrorsChanged: schemaErrorsSignal.attach,
    setInvalid: setInvalid,

    onValueChanged: fieldLocaleDoc.onValueChanged,
    getValue: fieldLocaleDoc.get,
    setValue: fieldLocaleDoc.set,
    setString: fieldLocaleDoc.setString,
    removeValue: fieldLocaleDoc.remove,
    removeValueAt: fieldLocaleDoc.removeAt,
    insertValue: fieldLocaleDoc.insert,
    pushValue: fieldLocaleDoc.push,

    id: ctField.apiName, // we only want to expose the public ID
    locale: $scope.locale.code,
    type: ctField.type,
    linkType: ctField.linkType,
    itemLinkType: dotty.get(ctField, ['items', 'linkType']),
    required: !!ctField.required,
    validations: ctField.validations || [],
    itemValidations: dotty.get(ctField, ['items', 'validations'], [])
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
    return $scope.fieldLocale.access.disabled;
  }

  function getDefaultLocaleCode () {
    return TheLocaleStore.getDefaultLocale().code;
  }

  function getAvailableLocaleCodes () {
    return _.map(TheLocaleStore.getPrivateLocales(), 'code');
  }
}]);
