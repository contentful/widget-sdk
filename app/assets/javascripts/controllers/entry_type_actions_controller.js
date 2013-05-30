'use strict';

angular.module('contentful').
  controller('EntryTypeActionsCtrl', function EntryTypeActionsCtrl($scope, notification, analytics) {

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.entryType.data.name + '"';
  }

  $scope.delete = function () {
    $scope.entryType.delete(function (err, entryType) {
      $scope.$apply(function (scope) {
        if (err) return notification.error('Error deleting content type');
        notification.info('Content type deleted successfully');
        scope.$emit('entityDeleted', entryType);
        scope.bucketContext.removeEntryType($scope.entryType);
      });
    });
  };

  $scope.$on('entityDeleted', function (event, entryType) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (entryType === scope.entryType) {
        scope.tab.close();
      }
    }
  });

  $scope.canPublish = function() {
    if (!$scope.otDoc) return false;
    var version = $scope.otDoc.version;
    var publishedVersion = $scope.otDoc.getAt(['sys', 'publishedVersion']);
    var notPublishedYet = !publishedVersion;
    var updatedSincePublishing = version !== publishedVersion + 1;
    var hasFields = $scope.otDoc.getAt(['fields']).length > 0;
    return $scope.entryType.canPublish() &&
      (notPublishedYet || updatedSincePublishing) &&
      hasFields &&
      $scope.entityValid;
  };

  $scope.publish = function () {
    var version = $scope.otDoc.version;
    var verb = $scope.entryType.isPublished() ? 'updated' : 'activated';
    $scope.entryType.publish(version, function (err, publishedEntryType) {
      $scope.$apply(function(scope){
        if (err) {
          var errorId = err.body.sys.id;
          var reason = errorId;
          if (errorId === 'validationFailed')
            reason = 'Validation failed';
          if (errorId === 'versionMismatch')
            reason = 'Can only publish most recent version';
          return notification.error('Error publishing ' + title() + ': ' + reason);
        }

        notification.info(title() + ' ' + verb + ' successfully');
        analytics.track('Published EntryType', {
          entryTypeId: $scope.entryType.getId(),
          entryTypeName: $scope.entryType.data.name,
          version: version
        });

        //console.log('editor has published %o as %o', scope.entryType, publishedEntryType);
        scope.updatePublishedEntryType(publishedEntryType);
        scope.bucketContext.registerPublishedEntryType(publishedEntryType);
        scope.bucketContext.refreshEntryTypes();
      });
    });
  };

  $scope.publishButtonLabel = function () {
    var publishedAt = null;
    try {
      publishedAt = $scope.entryType.data.sys.publishedAt;
    } catch (e) { }

    if (publishedAt) {
      return 'Update';
    } else {
      return 'Activate';
    }
  };

});

