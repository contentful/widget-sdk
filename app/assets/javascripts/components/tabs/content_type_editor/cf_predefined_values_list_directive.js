'use strict';
angular.module('contentful').directive('cfPredefinedValuesList', function () {

  return {
    restrict: 'C',
    template: JST['cf_predefined_values_list'](),

    link: function (scope, elem) {
      scope.reorderIndexes = function (indexes) {
        var oldOrder = _.clone(scope.validation.in);
        scope.validation.in = _.map(indexes, function(index){ return oldOrder[index]; });
        scope.updateDoc();
      };

      var reorderIndexes = _.bind(scope.reorderIndexes, scope);

      var blockList = elem.find('.block-list');
      blockList.sortable({
        axis: 'y',
        items: '> li',
        update: function (event) {
          var reorderedIndexes = $(event.target).sortable('toArray', {attribute: 'index'});
          reorderedIndexes = _.map(reorderedIndexes, function(val){return parseInt(val, 10);});
          reorderIndexes(reorderedIndexes);
        }
      });
    }

  };
});
