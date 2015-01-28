'use strict';

angular.module('contentful').controller('cfKalturaMultiVideoEditorController', ['$injector', '$scope', function($injector, $scope){
  var KalturaEditorControllerMixin = $injector.get('KalturaEditorControllerMixin');
  var kalturaClientWrapper         = $injector.get('kalturaClientWrapper');

  var controller                   = this;

  kalturaClientWrapper.setOrganizationId($scope.spaceContext.space.getOrganizationId());

  _.extend(controller, KalturaEditorControllerMixin);

  //overwrite this function
  this.customAttrsForPlayer = customAttrsForPlayer;

  function customAttrsForPlayer(video) {
    //TODO: remove coupling with assetId
    //see cfMultiVideoEditorController for
    //a related comment
    return {entryId: video.assetId};
  }

}]);
