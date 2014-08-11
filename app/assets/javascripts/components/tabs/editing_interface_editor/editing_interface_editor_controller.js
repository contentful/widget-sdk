'use strict';

angular.module('contentful').controller('EditingInterfaceEditorCtrl', ['$scope', '$injector', function EditingInterfaceEditorCtrl($scope, $injector) {
  var $controller = $injector.get('$controller');
  var editingInterfaces = $injector.get('editingInterfaces');

  $controller('FieldSettingsController', {$scope: $scope});
  $controller('FieldActionsController', {$scope: $scope});

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');
  $scope.$watch('tab.params.editingInterface', 'editingInterface=tab.params.editingInterface');

  $scope.getFieldForWidget = function(widget) {
    return _.find($scope.contentType.data.fields, {id: widget.fieldId});
  };

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
