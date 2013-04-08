angular.module('contentful/controllers').controller('EntryActionsCtrl', function EntryActionsCtrl($scope) {
  'use strict';

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  $scope.canDelete = function() {
    if (!$scope.doc) return false;
    var deletedAt  = $scope.doc.getAt(['sys', 'deletedAt']);
    var archivedAt = $scope.doc.getAt(['sys', 'archivedAt']);
    return archivedAt && !deletedAt;
  };

  $scope.delete = function () {
    $scope.entry.delete(function (err, entry) {
      $scope.$apply(function (scope) {
        if (!err) {
          scope.$emit('entityDeleted', entry);
        }
      });
    });
  };

  $scope.$on('entityDeleted', function (event, entry) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (entry === scope.entry) {
        scope.tab.close();
      }
    }
  });

  $scope.canArchive = function() {
    if (!$scope.doc) return false;
    var version = $scope.doc.version;
    var archivedVersion  = $scope.doc.getAt(['sys', 'archivedVersion']);
    var publishedVersion = $scope.doc.getAt(['sys', 'publishedVersion']);
    return !publishedVersion && (!archivedVersion || version > archivedVersion);
  };

  $scope.archive = function() {
    $scope.entry.archive(function() {
      $scope.$apply();
    });
  };

  $scope.canUnarchive = function() {
    return $scope.canDelete();
  };

  $scope.unarchive = function() {
    $scope.entry.unarchive(function() {
      $scope.$apply();
    });
  };

  $scope.canUnpublish = function() {
    if (!$scope.doc) return false;
    var publishedVersion = $scope.doc.getAt(['sys', 'publishedVersion']);
    return publishedVersion;
  };

  $scope.unpublish = function () {
    $scope.entry.unpublish(function (err) {
      $scope.$apply(function(scope){
        if (err) {
          window.alert('could not unpublish, version mismatch');
        } else {
          scope.updateFromShareJSDoc();
        }
      });
    });
  };

  $scope.canPublish = function() {
    if (!$scope.doc) return false;
    var version = $scope.doc.version;
    var archivedVersion  = $scope.doc.getAt(['sys', 'archivedVersion']);
    var publishedVersion = $scope.doc.getAt(['sys', 'publishedVersion']);
    return !archivedVersion && (!publishedVersion || version > publishedVersion);
  };

  $scope.publish = function () {
    var version = $scope.doc.version;
    $scope.entry.publish(version, function (err) {
      $scope.$apply(function(scope){
        if (err) {
          console.log('publish error', err);
          if (err.body.sys.id == 'validationFailed') {
            window.alert('could not publish, validation failed');
          } else {
            window.alert('could not publish, version mismatch');
          }
        } else {
          scope.updateFromShareJSDoc();
        }
      });
    });
  };

  $scope.publishButtonLabel = function () {
    var publishedAt = null;
    try {
      publishedAt = $scope.doc.getAt(['sys', 'publishedAt']);
    } catch (e) { }

    if (publishedAt) {
      return 'Republish';
    } else {
      return 'Publish';
    }
  };

});

