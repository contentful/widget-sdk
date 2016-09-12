'use strict';

angular.module('contentful').directive('cfKalturaMultiVideoEditor', [function(){

  return {
    restrict: 'E',
    scope: {},
    template: '<cf-multi-video-editor />',
    require: '^cfWidgetApi',
    link: {pre: function (scope, elem, attrs, widgetApi) {
      // TODO We should not expose the widget API on the scope, but
      // currently this is the only way we can deal with the
      // architecture of the video widgets.
      scope.widgetApi = widgetApi;
    }},
    controller: 'cfKalturaMultiVideoEditorController',
    controllerAs: 'providerVideoEditorController'
  };

}])

.controller('cfKalturaMultiVideoEditorController', ['$injector', function($injector){
  var KalturaEditorControllerMixin = $injector.get('KalturaEditorControllerMixin');
  var kalturaClientWrapper = $injector.get('kalturaClientWrapper');
  var spaceContext = $injector.get('spaceContext');

  kalturaClientWrapper.setOrganizationId(spaceContext.space.getOrganizationId());

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
