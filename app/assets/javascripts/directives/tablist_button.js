'use strict';

angular.module('contentful/directives').directive('tablistButton', function() {
  return {
    template: JST.tablist_button(),
    restrict: 'C',
    link: function(scope) {
      scope.createEntry = function(entryType) {
        this.$emit('tabListButtonClicked', {
          button: 'createEntry',
          entryType: entryType
        });
      };

      scope.createEntryType = function() {
        this.$emit('tabListButtonClicked', {
          button: 'createEntryType'
        });
      };
    }
  };
});
