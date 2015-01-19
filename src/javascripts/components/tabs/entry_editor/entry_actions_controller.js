'use strict';
angular.module('contentful').controller('EntryActionsController', ['$scope', 'notification', 'logger', function EntryActionsController($scope, notification, logger) {

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.entryTitle($scope.entry) + '"';
  }

  $scope.delete = function () {
    $scope.entry.delete()
    .then(function(entry){
      notification.info('Entry deleted successfully');
      $scope.broadcastFromSpace('entityDeleted', entry);
    })
    .catch(function(err){
      logger.logServerError('Error deleting Entry', {error: err });
      notification.error('Error deleting Entry');
    });
  };

  $scope.duplicate = function() {
    var contentType = $scope.entry.getSys().contentType.sys.id;
    var data = _.omit($scope.entry.data, 'sys');

    $scope.spaceContext.space.createEntry(contentType, data)
    .then(function(entry){
      $scope.navigator.entryEditor(entry).goTo();
    })
    .catch(function(err){
      logger.logServerError('Could not duplicate Entry', {error: err });
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
      logger.logServerError('Error archiving entry', {error: err });
    });
  };

  $scope.unarchive = function() {
    $scope.entry.unarchive()
    .then(function(){
      notification.info(title() + ' unarchived successfully');
    })
    .catch(function(err){
      notification.warn('Error unarchiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerError('Error unarchiving entry', {error: err });
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
      logger.logServerError('Error unpublishing entry', {error: err });
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

  function handlePublishErrors(err) {
    var errorId = dotty.get(err, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
      notification.warn('Error publishing ' + title() + ': Validation failed');
    } else if (errorId === 'VersionMismatch'){
      notification.warn('Error publishing ' + title() + ': Can only publish most recent version');
    } else if (errorId === 'InvalidEntry'){
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
      logger.logServerError('Publishing the entry has failed due to a server issue. We have been notified.', {error: err });
      notification.error('Publishing the entry has failed due to a server issue. We have been notified.');
    }
  }

}]);

