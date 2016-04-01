'use strict';

angular.module('contentful').directive('cfKalturaMultiVideoEditor', [function(){

  return {
    restrict: 'E',
    scope: true,
    template: '<cf-multi-video-editor />',
    controller: 'cfKalturaMultiVideoEditorController',
    controllerAs: 'providerVideoEditorController'
  };

}])

.controller('cfKalturaMultiVideoEditorController', ['$injector', '$scope', function($injector, $scope){
  var KalturaEditorControllerMixin = $injector.get('KalturaEditorControllerMixin');
  var kalturaClientWrapper = $injector.get('kalturaClientWrapper');

  kalturaClientWrapper.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  _.extend(this, KalturaEditorControllerMixin);

  //overwrite this function
  this.customAttrsForPlayer = customAttrsForPlayer;

  function customAttrsForPlayer(video) {
    //TODO: remove coupling with assetId
    //see cfMultiVideoEditorController for
    //a related comment
    return {entryId: video.assetId};
  }

}]);
