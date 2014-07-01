'use strict';
angular.module('contentful').directive('cfPredefinedValuesList', ['debounce', function (debounce) {

  var VISIBLE_ITEMS = 6;

  return {
    restrict: 'C',
    template: JST['cf_predefined_values_list'](),

    link: function (scope, elem) {
      scope.validationSortOptions = {
        axis: 'y',
        stop: function() { scope.updateDoc(); }
      };

      var blockList = elem.find('.block-list');

      blockList.on('scroll', debounce(function(){
        scope.$digest();
      }, 500));

      // TODO WTF is this doing in a watcher?
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
}]);
