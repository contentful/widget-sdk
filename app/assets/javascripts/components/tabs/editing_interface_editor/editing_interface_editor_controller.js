'use strict';

angular.module('contentful').controller('EditingInterfaceEditorCtrl', ['$scope', function EditingInterfaceEditorCtrl($scope) {
  $scope.$watch('tab.params.contentType', 'contentType=tab.params.contentType');
  $scope.$watch('tab.params.editingInterface', 'editingInterface=tab.params.editingInterface');
}]);
