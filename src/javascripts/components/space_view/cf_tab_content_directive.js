'use strict';

angular.module('contentful').directive('cfTabContent', function(){
  return {
    template: JST.cf_tab_content(),
    restrict: 'E',
    replace: true
  };
});
