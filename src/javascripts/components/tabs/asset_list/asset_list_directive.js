'use strict';

angular.module('contentful').directive('cfAssetList', function(){
  return {
    template: JST.asset_list(),
    restrict: 'A',
    controller: 'AssetListController',
    link: function (scope, elem) {
      scope.$watch('selection.isEmpty()', function (empty) {
        if (empty) {
          elem.removeClass('with-tab-actions');
        } else {
          elem.addClass('with-tab-actions');
        }
      });
    }
  };
});
