'use strict';

angular.module('contentful').controller('cfKalturaEditorController', ['$injector', '$scope', function($injector, $scope){
  var KalturaEditorControllerMixin = $injector.get('KalturaEditorControllerMixin');
  var kalturaClientWrapper         = $injector.get('kalturaClientWrapper');

  var controller                   = this;

  kalturaClientWrapper.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  _.extend(controller, KalturaEditorControllerMixin);
}]);
