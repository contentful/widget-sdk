'use strict';

angular.module('contentful').controller('cfOoyalaEditorController', ['$scope', '$injector', function($scope, $injector){
  var OoyalaEditorControllerMixin = $injector.get('OoyalaEditorControllerMixin');
  var ooyalaClient                = $injector.get('ooyalaClient');

  var controller                = this;

  ooyalaClient.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  _.extend(controller, OoyalaEditorControllerMixin);
}]);
