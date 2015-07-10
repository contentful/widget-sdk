'use strict';
angular.module('contentful').controller('EntryActionsController', ['$scope', '$rootScope', '$q', 'notification', 'logger', function EntryActionsController($scope, $rootScope, $q, notification, logger) {

  var originalEntryData, trackedPublishedVersion, trackedPreviousVersion;

  $scope.$watch('otEditable', function (otEditable) {
    if (otEditable && !originalEntryData) {
      var originalEntry = $scope.otGetEntity();
      originalEntryData = _.cloneDeep(originalEntry.data);

      trackedPublishedVersion = originalEntry.getPublishedVersion();
      trackedPreviousVersion = originalEntry.getVersion();

      $scope.publishedAt = moment(originalEntry.getPublishedAt()).format('h:mma [on] MMM DD, YYYY');
      $scope.updatedAt = moment(originalEntry.getUpdatedAt()).format('h:mma [on] MMM DD, YYYY');
    }
  });

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.entryTitle($scope.entry) + '"';
  }

  $scope.delete = function () {
    $scope.entry.delete()
    .then(function(entry){
      notification.info('Entry deleted successfully');
      $rootScope.$broadcast('entityDeleted', entry);
    })
    .catch(function(err){
      logger.logServerWarn('Error deleting Entry', {error: err });
      notification.error('Error deleting Entry');
    });
  };

  $scope.duplicate = function() {
    var contentType = $scope.entry.getSys().contentType.sys.id;
    var data = _.omit($scope.entry.data, 'sys');

    $scope.spaceContext.space.createEntry(contentType, data)
    .then(function(entry){
      $scope.$state.go('spaces.detail.entries.detail', { entryId: entry.getId(), addToContext: true });
    })
    .catch(function(err){
      logger.logServerWarn('Could not duplicate Entry', {error: err });
      notification.error('Could not duplicate Entry');
    });
  };

  $scope.archive = function() {
    $scope.entry.archive()
    .then(function(){
      notification.info(title() + ' archived successfully');
    })
    .catch(function(err){
      notification.warn('Error archiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error archiving entry', {error: err });
    });
  };

  $scope.unarchive = function() {
    $scope.entry.unarchive()
    .then(function(){
      notification.info(title() + ' unarchived successfully');
    })
    .catch(function(err){
      notification.warn('Error unarchiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error unarchiving entry', {error: err });
    });
  };

  $scope.canRevertToPublishedState = function () {
    var entry = $scope.entry;

    return (entry.isPublished() &&
           entry.getVersion() > (trackedPublishedVersion + 1));
  };

  $scope.revertToPublishedState = function () {
    function flashError(err) {
      notification.warn('Error reverting to the last published state of ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logSharejsWarn('Error reverting entry to published state', {error: err});
    }

    $scope.entry.getPublishedState().then(function (data) {
      var cb = $q.callbackWithApply();
      $scope.otDoc.at('fields').set(data.fields, cb);
      cb.promise
      .then(function () {
        $scope.otUpdateEntity();
        if (trackedPreviousVersion === (trackedPublishedVersion + 1)) {
          trackedPreviousVersion = $scope.entry.getVersion() + 1;
        }
        trackedPublishedVersion = $scope.entry.getVersion();
        notification.info('Entry reverted to the last published state successfully');
      }, flashError);
    })
    .catch(flashError);
  };

  $scope.canRevertToPreviousState = function () {
    var entry = $scope.entry;

    return entry.getVersion() > trackedPreviousVersion;
  };

  $scope.revertToPreviousState = function () {
    var cb = $q.callbackWithApply();
    if(!$scope.otDoc) return $q.when();
    $scope.otDoc.at('fields').set(originalEntryData.fields, cb);
    cb.promise
    .then(function () {
      $scope.otUpdateEntity();
      if (trackedPreviousVersion === (trackedPublishedVersion + 1)) {
        trackedPublishedVersion = $scope.entry.getVersion() - 1;
      }
      trackedPreviousVersion = $scope.entry.getVersion();
      notification.info('Entry reverted to the previous state successfully');
    }, function(err){
      notification.warn('Error reverting to the previous state of ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logSharejsWarn('Error reverting entry to previous state', {error: err});
    });
  };

  $scope.unpublish = function () {
    $scope.entry.unpublish()
    .then(function(){
      notification.info(title() + ' unpublished successfully');
      $scope.otUpdateEntity();
    })
    .catch(function(err){
      notification.warn('Error unpublishing ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error unpublishing entry', {error: err });
    });
  };

  $scope.publish = function () {
    var version = $scope.entry.getVersion();
    if (!$scope.validate()) {
      notification.warn('Error publishing ' + title() + ': ' + 'Validation failed');
      return;
    }
    $scope.entry.publish(version)
    .then(function(){
      $scope.entry.setPublishedVersion(version);
      if (trackedPreviousVersion === version) {
        trackedPreviousVersion = version + 1;
      }
      trackedPublishedVersion = version;
      notification.info(title() + ' published successfully');
    })
    .catch(handlePublishErrors);
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

  /**
   * TODO This is way to complicated: We should only care about the
   * errors in `body.details.errors` and expose them to the scope so
   * that they can be displayed at the proper location and show a
   * simple notifictation.
   *
   * For this to happen the CMA needs to be refactored.
   */
  function handlePublishErrors(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
      notification.warn('Error publishing ' + title() + ': Validation failed');
    } else if (errorId === 'VersionMismatch'){
      notification.warn('Error publishing ' + title() + ': Can only publish most recent version');
    } else if (errorId === 'UnresolvedLinks') {
      $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
      notification.warn('Error publishing ' + title() + ': Some linked entries are missing.');
    } else if (errorId === 'InvalidEntry') {
      if (err.body.message === 'Validation error') {
        $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
        notification.warn('Error publishing ' + title() + ': Validation failed');
      } else {
        var errors = dotty.get(err, 'body.details.errors');
        var details;
        if(errors.length > 0 && errors[0].name == 'linkContentType'){
          details = errors[0].details;
        } else {
          details = err.body.message;
        }
        notification.warn('Error publishing ' + title() + ':' + details);
      }
    } else {
      logger.logServerWarn('Publishing the entry has failed due to a server issue. We have been notified.', {error: err });
      notification.error('Publishing the entry has failed due to a server issue. We have been notified.');
    }
  }

}]);

