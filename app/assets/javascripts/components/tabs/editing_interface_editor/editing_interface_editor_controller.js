'use strict';

angular.module('contentful').controller('EditingInterfaceEditorCtrl', ['$scope', '$injector', function EditingInterfaceEditorCtrl($scope, $injector) {
  var $controller = $injector.get('$controller');

  $controller('FieldSettingsController', {$scope: $scope});
  $controller('FieldActionsController', {$scope: $scope});

  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');
  $scope.$watch('tab.params.editingInterface', 'editingInterface=tab.params.editingInterface');

  $scope.formWidgetsController = $controller('FormWidgetsController', {$scope: $scope});
  $scope.$watch('contentType', function (contentType) {
    $scope.formWidgetsController.contentType = contentType;
  });
  $scope.$watch('contentType.data.fields', 'formWidgetsController.updateWidgets()', true);

}]);
