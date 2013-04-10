angular.module('contentful/controllers').controller('EntryTypeFieldListCtrl', function ($scope) {
  'use strict';

  $scope.$watch('publishedEntryType', function(et, old, scope) {
    if (et && et.data.fields)
      scope.publishedIds = _.pluck(et.data.fields, 'id');
  });

  $scope.$on('published', function(event) {
    event.currentScope.$apply(function(scope) {
      scope.publishedIds = _.pluck(scope.publishedEntryType.data.fields, 'id');
    });
  });

});
