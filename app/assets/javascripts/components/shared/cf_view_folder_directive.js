'use strict';
angular.module('contentful').directive('cfViewFolder', function(){
  return {
    restrict: 'A',
    template: JST['cf_view_folder'](),
    controller: 'CfViewFolderController'
  };
});
