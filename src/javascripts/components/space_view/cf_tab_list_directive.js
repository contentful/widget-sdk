'use strict';

angular.module('contentful').directive('cfTabList', function(){
  return {
    template: JST.cf_tab_list(),
    restrict: 'A'
  };
});
