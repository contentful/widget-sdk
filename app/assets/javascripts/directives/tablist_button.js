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
            console.warn('createEntry not yet implemented in Tablist-Button', entryType);
            //this.$broadcast('createEntry', entryType);
            //$scope.createEntry = function(entryType) {
            //  $scope.bucket.createEntry({
            //    sys: {
            //      entryType: entryType.getId()
            //    }
            //  }, function(err, entry){
            //    if (!err) {
            //      $scope.$apply(function(scope){
            //        scope.editEntry(entry, 'create');
            //      });
            //    } else {
            //      console.log('Error creating entry', err);
            //    }
            //  });
            //};
          };

          scope.createEntryType = function() {
            console.warn('createEntryType not yet implemented in Tablist-Button');
            //this.$broadcast('createEntryType', entryType);
            //$scope.createEntryType = function() {
            //  var id = window.prompt('Please enter ID (only for development)');
            //  var name;
            //  if (!id || id === '') {
            //    id = null;
            //    name = 'Randomfoo';
            //  } else {
            //    name = id;
            //  }
            //  $scope.bucket.createEntryType({
            //    sys: {
            //      id: id
            //    },
            //    fields: [],
            //    name: name
            //  }, function(err, entryType){
            //    if (!err) {
            //      $scope.$apply(function(scope){
            //        scope.editEntryType(entryType, 'create');
            //      });
            //    } else {
            //      console.log('Error creating entryType', err);
            //    }
            //  });
            //};

          };
        }
      };
    }
  };

});

