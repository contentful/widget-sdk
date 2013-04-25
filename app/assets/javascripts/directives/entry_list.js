'use strict';

angular.module('contentful/directives').directive('entryList', function(){
  return {
    template: JST.entry_list(),
    restrict: 'C',
    controller: 'EntryListCtrl',
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
