'use strict';

angular.module('contentful/directives').directive('tablistButton', function() {
  return {
    template: JST.tablist_button(),
    restrict: 'C',
    scope: {
      bucketContext: '='
    },
    link: function(scope) {
      scope.publishedEntryTypes = [];
      scope.$watch('bucketContext.entryTypes', function(n,o, scope) {
        scope.publishedEntryTypes = _.filter(n, function(et) {
          return et.data.sys.publishedAt;
        });
      });

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
