define([
  'angular',
  'templates/tablist_button',

  'services/widgets'
], function(angular, tablistButtonTemplate){
  'use strict';

  return {
    name: 'tablistButton',
    factory: function() {
      return {
        template: tablistButtonTemplate(),
        restrict: 'E',
        scope: {
          tabList: '='
        }
      };
    }
  };

});

