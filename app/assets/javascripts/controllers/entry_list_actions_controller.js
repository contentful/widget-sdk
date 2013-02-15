'use strict';

angular.module('contentful/controllers').controller('EntryListActionsCtrl', function EntryListCtrl($scope) {

  var forAllEntries = function(callback) {
    var entries = $scope.selection.getSelected();
    _.each(entries, callback);
  };

  var makeAfterCallback = function() {
    var num = $scope.selection.size();
    return _.after(num, function() {
      $scope.$apply();
      //TODO adjust counts
    });
  };

  var perform = function(method) {
    var afterCallback = makeAfterCallback();
    forAllEntries(function(entry) {
      entry[method](afterCallback);
    });
  };

  $scope.publishSelected = function() {
    var afterCallback = makeAfterCallback();
    forAllEntries(function(entry) {
      entry.publish(entry.data.sys.version, afterCallback);
    });
  };

  $scope.unpublishSelected = function() {
    perform('unpublish');
  };

  $scope.deleteSelected = function() {
    perform('delete');
  };

  $scope.archiveSelected = function() {
    perform('archive');
  };

  $scope.unarchiveSelected = function() {
    perform('unarchive');
  };
});
