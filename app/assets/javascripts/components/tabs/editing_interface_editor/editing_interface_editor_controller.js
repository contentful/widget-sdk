'use strict';

angular.module('contentful').controller('EditingInterfaceEditorController', ['$scope', '$injector', function EditingInterfaceEditorController($scope, $injector) {
  var $controller = $injector.get('$controller');
  var editingInterfaces = $injector.get('editingInterfaces');

  $controller('FieldSettingsController', {$scope: $scope});
  $controller('FieldActionsController', {$scope: $scope});

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');
  $scope.$watch('tab.params.editingInterface', 'editingInterface=tab.params.editingInterface');

  $scope.getFieldForWidget = getFieldForWidget;
  $scope.restoreDefaults = restoreDefaults;
  $scope.update = saveToServer;
  $scope.delete = angular.noop; // TODO: implement when we have more than the default interface

  function getFieldForWidget(widget) {
    return _.find($scope.contentType.data.fields, {id: widget.fieldId});
  }

  function restoreDefaults() {
    $scope.closeAllFields();
    var editingInterface = editingInterfaces.defaultInterface($scope.contentType);
    editingInterface.sys = _.clone($scope.editingInterface.sys);
    $scope.editingInterface = editingInterface;
  }

  function saveToServer() {
    editingInterfaces.saveForContentType($scope.contentType, $scope.editingInterface)
    .then(function(editingInterface) {
      $scope.editingInterface = editingInterface;
    }, function() {
      return loadFromServer();
    });
  }

  function loadFromServer () {
    editingInterfaces.forContentTypeWithId($scope.contentType, $scope.editingInterface.id)
    .then(function(interf) {
      $scope.editingInterface = interf;
    });
  }

}]);
