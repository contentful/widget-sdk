'use strict';

/**
 * @ngdoc type
 * @name AddFieldDialogController
 *
 * @scope.requires {object} dialog
 *
 * @scope.provides {object} viewState
 * @scope.provides {object} availableFieldTypes
 * @scope.provides {object} newField
 * @scope.provides {object} selectedType
 * @scope.provides {bool}   canHaveFieldVariant
 * @scope.provides {string} selectedFieldVariant
 * The currently selected field variant value provided by the single/multiple property
*/
angular.module('contentful').controller('AddFieldDialogController',
            ['$scope', '$injector', function AddFieldDialogController($scope, $injector) {

  var $controller         = $injector.get('$controller');
  var availableFieldTypes = $injector.get('availableFieldTypes');
  var random              = $injector.get('random');
  var stringUtils         = $injector.get('stringUtils');

  $scope.viewState = $controller('ViewStateController', {
    $scope: $scope,
    defaultState: 'fieldSelection'
  });

  $scope.availableFieldTypes = availableFieldTypes;
  $scope.selectType          = selectType;
  $scope.configureField      = configureField;

  $scope.newField = {
    name: '',
    id: random.id(),
    type: '',
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
   * @param {object} typeInfo
   * Object with information about the selected field type
  */
  function selectType(typeInfo) {
    $scope.selectedType = typeInfo;
    $scope.canHaveFieldVariant = _.isObject(typeInfo.type);
    if($scope.canHaveFieldVariant){
      $scope.selectedFieldVariant = typeInfo.type.single;
    }
    $scope.dialog.title = 'New '+typeInfo.name+' field';
    $scope.viewState.set('fieldConfiguration');
  }

  /**
   * @ngdoc method
   * @name AddFieldDialogController#scope#configureField
   *
   * @description
   * Configures optional parameters of the previously selected field
   * and closes the dialog
  */
  function configureField() {
    if($scope.canHaveFieldVariant){
      $scope.newField.type = $scope.selectedFieldVariant;
      if($scope.selectedFieldVariant == 'Array'){
        $scope.newField.linkType = $scope.selectedType.linkType;
      }
    } else {
      $scope.newField.type = $scope.selectedType.type;
    }
    $scope.newField.apiName = stringUtils.toIdentifier($scope.newField.name);
    $scope.dialog.confirm($scope.newField);
  }

}]);
