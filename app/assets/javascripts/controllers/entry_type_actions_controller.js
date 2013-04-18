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
    if (!$scope.doc) return false;
    var version = $scope.doc.version;
    var publishedVersion = $scope.doc.getAt(['sys', 'publishedVersion']);
    return this.entryType.canPublish() && (!publishedVersion || version > publishedVersion);
  };

  $scope.publish = function () {
    var version = $scope.doc.version;
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
      publishedAt = $scope.doc.getAt(['sys', 'publishedAt']);
    } catch (e) { }

    if (publishedAt) {
      return 'Republish';
    } else {
      return 'Publish';
    }
  };

});

