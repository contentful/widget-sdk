'use strict';

/**
 * @ngdoc type
 * @name AddFieldDialogController
 *
 * @scope.requires {object} dialog
 *
 * @scope.provides {object}          viewState
 * @scope.provides {FieldDescriptor[]} availableFields
 * @scope.provides {Field}           newField
 * @scope.provides {FieldDescriptor} selectedType
 * @scope.provides {bool}            fieldIsList
*/
angular.module('contentful')
.controller('AddFieldDialogController', ['$scope', 'require', function AddFieldDialogController ($scope, require) {
  var $controller = require('$controller');
  var fieldFactory = require('fieldFactory');
  var fieldDecorator = require('fieldDecorator');
  var random = require('random');
  var stringUtils = require('stringUtils');
  var buildMessage = require('fieldErrorMessageBuilder');
  var $q = require('$q');

  $scope.viewState = $controller('ViewStateController', {
    $scope: $scope,
    defaultState: 'fieldSelection'
  });

  $scope.fieldGroupRows = chunk(fieldFactory.groups, 4);
  $scope.selectFieldGroup = selectFieldGroup;
  $scope.showFieldSelection = showFieldSelection;
  $scope.create = create;
  $scope.createAndConfigure = createAndConfigure;

  $scope.schema = {
    errors: function (field) {
      return fieldDecorator.validateInContentType(field, $scope.contentType.data);
    },
    buildMessage: buildMessage
  };

  // Initial dialog state
  showFieldSelection();

  /**
   * @ngdoc method
   * @name AddFieldDialogController#scope#showFieldSelection
   *
   * @description
   * Resets the information regarding the selected type of field
   * in case the user wants to change their selection
  */
  function showFieldSelection () {
    $scope.field = {
      data: {
        name: '',
        id: random.id(),
        apiName: ''
      },
      isList: false
    };
    $scope.viewState.set('fieldSelection');

    if ($scope.newFieldForm) {
      $scope.newFieldForm.showErrors = false;
    }
  }

  function selectFieldGroup (group) {
    $scope.fieldGroup = group;
    $scope.fieldTypes = _.mapValues(_.groupBy(group.types, 'name'), first);
    $scope.field.type = group.types[0];

    $scope.viewState.set('fieldConfiguration');
  }

  $scope.$watch('field.data.name', function (name) {
    var apiNameField = $scope.newFieldForm.apiName;
    var apiName = $scope.field.data.apiName;
    if (!apiNameField || !apiNameField.$touched || !apiName) {
      $scope.field.data.apiName = stringUtils.toIdentifier(name);
      if (apiNameField) {
        apiNameField.$setUntouched();
      }
    }
  });

  /**
   * @ngdoc method
   * @name AddFieldDialogController#$scope.create
   *
   * @description
   * Create a field from the user input and validate it. Then confirm
   * the dialog with that field.
   */
  function create () {
    var field = $scope.field.data;
    var typeInfo = fieldFactory.createTypeInfo($scope.field.type, $scope.field.isList);
    _.extend(field, typeInfo);

    if (!$scope.validator.run()) {
      $scope.newFieldForm.showErrors = true;
      return $q.reject(new Error('Invalid user data'));
    }

    return $scope.dialog.confirm(field)
    .promise.then(function () {
      return field;
    });
  }

  /**
   * @ngdoc method
   * @name AddFieldDialogController#$scope.createAndConfigure
   *
   * @description
   * Call `$scope.create()` and open the field configuration dialog
   * afterwards.
   */
  function createAndConfigure () {
    create()
    // We don’t care about validation errors raised by
    // `configureField`, so catch is noop.
    .then(function (field) {
      $scope.ctEditorController.openFieldDialog(field);
    }, _.noop);
  }

  function chunk (array, size) {
    var index = 0;
    var length = array.length;
    var resIndex = -1;
    var result = new Array(Math.ceil(length / size));

    while (index < length) {
      result[++resIndex] = array.slice(index, (index += size));
    }
    return result;
  }

  function first (array) {
    return array[0];
  }
}]);
