require([
  'angular',
  'directives',
  'templates/entry_list'
], function(angular, directives, entryListTemplate){
  'use strict';

  directives.directive('entryList', function(){
    var entryListDirective = {
      template: entryListTemplate(),
      restrict: 'E',
    };

    return entryListDirective;
  });
})
