'use strict';

angular.module('contentful').controller('EditingInterfaceEditorCtrl', ['$scope', '$injector', function EditingInterfaceEditorCtrl($scope, $injector) {
  var $controller = $injector.get('$controller');
  var editingInterfaces = $injector.get('editingInterfaces');

  $controller('FieldSettingsController', {$scope: $scope});
  $controller('FieldActionsController', {$scope: $scope});

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');
  $scope.$watch('tab.params.editingInterface', 'editingInterface=tab.params.editingInterface');

  $scope.formWidgetsController = $controller('FormWidgetsController', {$scope: $scope});
  $scope.$watch('contentType', function (contentType) {
    $scope.formWidgetsController.contentType = contentType;
  });

  var _contentTypeFields,
      _editingInterface;

  function checkContentTypeFields() {
    var contentType = $scope.contentType;
    if(contentType && contentType.data && contentType.data.fields){
      if(!_contentTypeFields){
        _contentTypeFields = angular.copy(contentType.data.fields, _contentTypeFields);
        return true;
      } else {
        var differs = !angular.equals(contentType.data.fields, _contentTypeFields);
        if(differs) angular.copy(contentType.data.fields, _contentTypeFields);
        return differs;
      }
    }
  }

  function checkEditingInterface() {
    var editingInterface = $scope.editingInterface;
    if(editingInterface){
      if(!_editingInterface){
        _editingInterface = angular.copy(editingInterface, _editingInterface);
        return true;
      } else {
        var differs = !angular.equals(editingInterface, _editingInterface);
        if(differs) angular.copy(editingInterface, _editingInterface);
        return differs;
      }
    }
  }

  $scope.$watch(function () {
    return (checkContentTypeFields() || checkEditingInterface()) && _contentTypeFields && _editingInterface;
  }, function (modified) {
    if(modified)
      $scope.formWidgetsController.updateWidgetsFromInterface($scope.editingInterface);
  });

  $scope.restoreDefaults = function () {
    $scope.closeAllFields();
    var editingInterface = editingInterfaces.defaultInterface($scope.contentType);
    editingInterface.sys = _.clone($scope.editingInterface.sys);
    $scope.editingInterface = editingInterface;
  };

  $scope.update = function () {
    editingInterfaces.saveForContentType($scope.contentType, $scope.editingInterface);
  };

  $scope.delete = function () {
    // TODO: implement when we have more than the default interface
  };

}]);
