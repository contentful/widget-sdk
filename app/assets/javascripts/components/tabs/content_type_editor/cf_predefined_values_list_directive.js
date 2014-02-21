'use strict';
angular.module('contentful').directive('cfPredefinedValuesList', function () {

  var VISIBLE_ITEMS = 6;

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

      blockList.on('scroll', _.debounce(function(){
        scope.$digest();
      }, 500));

      function getListHeight(){
        var clonedList = blockList.clone();
        clonedList.hide();
        clonedList.css('overflow-y', 'visible');
        clonedList.css('max-height', 'none');
        clonedList.appendTo(blockList.parent());
        var height = clonedList.height();
        clonedList.remove();
        return height;
      }

      scope.atTop = function () {
        if(scope.validation.in && scope.validation.in.length <= VISIBLE_ITEMS) return true;
        if(blockList.scrollTop() === 0) return true;
        return false;
      };

      scope.atBottom = function () {
        if(scope.validation.in && scope.validation.in.length <= VISIBLE_ITEMS) return true;
        var fullListHeight = getListHeight();
        var listHeight = blockList.height();
        if(blockList.scrollTop() + listHeight >= fullListHeight) return true;
        return false;
      };

    }

  };
});
