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
 * @scope.requires {function} isDisabled
 */
angular.module('contentful')
.directive('cfWidgetApi', [function () {
  return {
    restrict: 'A',
    controller: 'WidgetApiController'
  };
}])
.controller('WidgetApiController', ['$scope', '$injector', function ($scope, $injector) {
  var $q = $injector.get('$q');
  var newSignal = $injector.get('signal').createMemoized;
  var spaceContext = $injector.get('spaceContext');
  var TheLocaleStore = $injector.get('TheLocaleStore');

  var valueChangedSignal = newSignal($scope.otSubDoc.getValue());
  var isDisabledSignal = newSignal(isEditingDisabled());
  var schemaErrorsSignal = newSignal(null);
  var ctField = $scope.widget.field;

  $scope.$on('otValueChanged', createValueChangedSignalDispatcher());
  $scope.$on('otValueReverted', createValueChangedSignalDispatcher(true));

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

  this.space = {
    getEntries: function (query) {
      return spaceContext.space.getEntries(query);
    }
  };

  this.field = {
    onValueChanged: valueChangedSignal.attach,
    onDisabledStatusChanged: isDisabledSignal.attach,
    onSchemaErrorsChanged: schemaErrorsSignal.attach,
    getValue: getValue,
    setValue: createSetter('changeValue'),
    setString: createSetter('changeString'),
    removeValue: removeValue,
    removeValueAt: removeValueAt,
    insertValue: insertValue,
    pushValue: pushValue,

    id: ctField.apiName, // we only want to expose the public ID
    locale: $scope.locale.code,
    type: ctField.type,
    required: !!ctField.required,
    validations: ctField.validations,
    itemValidations: dotty.get(ctField, ['items', 'validations'])
  };

  function getValue () {
    return $scope.otSubDoc.getValue();
  }

  function createSetter (method) {
    return function setValue (value) {
      // We only test for equality when the value is guaranteed to be
      // equal.
      if (!_.isObject(value) && value === getValue()) {
        return $q.resolve(value);
      } else {
        return $scope.otSubDoc[method](value);
      }
    };
  }

  function removeValue () {
    return $scope.otSubDoc.removeValue();
  }

  function createValueChangedSignalDispatcher (shouldCheckPath) {
    return function dispatchValueChangedSignal (_event, path, value) {
      if (!shouldCheckPath || isPathMatching(path)) {
        valueChangedSignal.dispatch(value);
      }
    };
  }

  function isPathMatching (path) {
    if (!_.isArray($scope.otPath) || !_.isArray(path)) {
      throw new Error('Path should be an array of strings.');
    }

    return _.isEqual($scope.otPath, path);
  }

  function removeValueAt (i) {
    return $q.denodeify(function (cb) {
      $scope.otSubDoc.doc.at(i).remove(cb);
    });
  }

  function insertValue (i, x) {
    // TODO Move this into otPath directive
    if ($scope.otSubDoc.getValue()) {
      return $q.denodeify(function (cb) {
        $scope.otSubDoc.doc.insert(i, x, cb);
      });
    } else if (i === 0) {
      return $scope.otSubDoc.changeValue([x]);
    } else {
      return $q.reject(new Error('Cannot insert index ' + i + 'into empty container'));
    }
  }

  function pushValue (x) {
    // TODO Move this into otPath directive
    var current = $scope.otSubDoc.getValue();
    if (current) {
      return $q.denodeify(function (cb) {
        $scope.otSubDoc.doc.insert(current.length, x, cb);
      });
    } else {
      return $scope.otSubDoc.changeValue([x]);
    }
  }

  function isEditingDisabled () {
    return $scope.fieldLocale.access.disabled;
  }

  function getDefaultLocaleCode () {
    return TheLocaleStore.getDefaultLocale().code;
  }

  function getAvailableLocaleCodes () {
    return _.pluck(TheLocaleStore.getPrivateLocales(), 'code');
  }
}]);
