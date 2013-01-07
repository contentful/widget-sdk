define([
  'angular',
  'templates/tablist_button',
  'lodash',

  'services/widgets'
], function(angular, tablistButtonTemplate, _){
  'use strict';

  return {
    name: 'tablistButton',
    factory: function() {
      return {
        template: tablistButtonTemplate(),
        restrict: 'E',
        scope: {
          bucketContext: '='
        },
        link: function(scope) {
          scope.publishedEntryTypes = [];
          scope.$watch('bucketContext.entryTypes', function(n,o, scope) {
            scope.publishedEntryTypes = _(n).filter(function(et) {
                return et.data.sys.publishedAt && et.data.sys.publishedAt > 0;
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
    }
  };

});

