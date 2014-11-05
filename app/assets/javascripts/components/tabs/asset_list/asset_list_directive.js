'use strict';

angular.module('contentful').directive('assetList', function(){
  return {
    template: JST.asset_list(),
    restrict: 'C',
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
