'use strict';

angular.module('contentful/controllers').
  controller('EntryTypeActionsCtrl', function EntryTypeActionsCtrl($scope, notification) {

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
    var updatedSincePublishing = version > publishedVersion;
    var hasFields = $scope.otDoc.getAt(['fields']).length > 0;
    return this.entryType.canPublish() &&
      (notPublishedYet || updatedSincePublishing) &&
      hasFields;
  };

  $scope.publish = function () {
    var version = $scope.otDoc.version;
    $scope.entryType.publish(version, function (err) {
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

        notification.info(title() + ' published successfully');
        scope.otUpdateEntity();
      });
    });
  };

  $scope.publishButtonLabel = function () {
    var publishedAt = null;
    try {
      publishedAt = $scope.otDoc.getAt(['sys', 'publishedAt']);
    } catch (e) { }

    if (publishedAt) {
      return 'Republish';
    } else {
      return 'Publish';
    }
  };

});

