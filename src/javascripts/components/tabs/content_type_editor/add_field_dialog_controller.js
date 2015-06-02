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

  var $controller         = $injector.get('$controller');
  var fieldFactory        = $injector.get('fieldFactory');
  var random              = $injector.get('random');
  var stringUtils         = $injector.get('stringUtils');

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
    $scope.fieldIsList = false;
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
    var typeInfo = fieldFactory.createTypeInfo($scope.selectedType.type, $scope.fieldIsList);
    _.extend(field, typeInfo, {
      apiName: stringUtils.toIdentifier(field.name)
    });
    $scope.dialog.confirm($scope.newField);
  }

}]);
