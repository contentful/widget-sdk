'use strict';

angular.module('contentful').directive('cfKalturaMultiVideoEditor', [function(){

  return {
    restrict   : 'E',
    scope      : true,
    template   : JST['cf_kaltura_multi_video_editor'](),
    controller : 'cfKalturaMultiVideoEditorController',
    controllerAs: 'providerVideoEditorController'
  };

}]);
