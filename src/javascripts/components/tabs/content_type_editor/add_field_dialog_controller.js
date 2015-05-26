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
.controller('AddFieldDialogController',
            ['$scope', '$injector', function AddFieldDialogController($scope, $injector) {

  var $controller    = $injector.get('$controller');
  var fieldFactory   = $injector.get('fieldFactory');
  var fieldDecorator = $injector.get('fieldDecorator');
  var random         = $injector.get('random');
  var stringUtils    = $injector.get('stringUtils');
  var buildMessage   = $injector.get('fieldErrorMessageBuilder');
  var trackField     = $injector.get('analyticsEvents').trackField;

  $scope.viewState = $controller('ViewStateController', {
    $scope: $scope,
    defaultState: 'fieldSelection'
  });

  $scope.availableFields = fieldFactory.all;
  $scope.selectType      = selectType;
  $scope.configureField  = configureField;

  $scope.newField = {
    name: '',
    id: random.id(),
    apiName: ''
  };

  $scope.schema = {
    errors: function (field) {
      return fieldDecorator.validateInContentType(field, $scope.contentType);
    },
    buildMessage: buildMessage,
  };

  /**
   * @ngdoc method
   * @name AddFieldDialogController#scope#selectType
   *
   * @description
   * Sets the relevant scope properties based on the selected field
   * and transitions to the field configuration state
   *
   * @param {object} typeDescriptor
   * Object with information about the selected field type.
  */
  function selectType (typeDescriptor) {
    $scope.selectedType = typeDescriptor;
    $scope.dialog.title = 'New '+typeDescriptor.name+' field';
    $scope.fieldOptions = {
      isList: false
    };
    $scope.viewState.set('fieldConfiguration');
  }

  /**
   * @ngdoc method
   * @name AddFieldDialogController#scope#configureField
   *
   * @description
   * Sets the type information and API Name for the new field and
   * closes the dialog.
  */
  function configureField () {
    var field = $scope.newField;
    var isList = $scope.fieldOptions.isList;
    var typeInfo = fieldFactory.createTypeInfo($scope.selectedType.type, isList);
    _.extend(field, typeInfo);
    if (!$scope.validator.run('name')) {
      return;
    }

    if (!field.apiName) {
      field.apiName = stringUtils.toIdentifier(field.name);
    }
    if ($scope.validator.run()) {
      trackCreateField(field);
      $scope.dialog.confirm($scope.newField);
    } else {
      $scope.showApiNameField = true;
    }
  }

  /**
   * @ngdoc analytics-event
   * @name Clicked Create Field Button
   * @param fieldId
   * @param originatingFieldType
   */
  function trackCreateField (field) {
    trackField('Clicked Create Field Button', field);
  }

}]);
