'use strict';
angular.module('contentful')
.controller('EntryActionsController',
['$scope', '$injector', function EntryActionsController ($scope, $injector) {
  var controller = this;

  var Command      = $injector.get('command');
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');
  var $rootScope   = $injector.get('$rootScope');
  var $q           = $injector.get('$q');


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

  function createEntryCommand (action, run, extension) {
    var can = function () {
      return $scope.entityActionsController.can(action);
    };

    controller[action] = Command.create(run, {available: can}, extension);
  }

  // TODO If we are sure that the data in the entry has been updated from the ShareJS doc,
  // We can query the entry instead of reimplementing the checks heere

  function title() {
    return '"' + $scope.spaceContext.entryTitle($scope.entry) + '"';
  }

  createEntryCommand('delete', function () {
    return $scope.entry.delete()
    .then(function(entry){
      notification.info('Entry deleted successfully');
      $rootScope.$broadcast('entityDeleted', entry);
    })
    .catch(function(err){
      logger.logServerWarn('Error deleting Entry', {error: err });
      notification.error('Error deleting Entry');
    });
  });


  createEntryCommand('duplicate', function () {
    var contentType = $scope.entry.getSys().contentType.sys.id;
    var data = _.omit($scope.entry.data, 'sys');

    return $scope.spaceContext.space.createEntry(contentType, data)
    .then(function(entry){
      $scope.$state.go('spaces.detail.entries.detail', { entryId: entry.getId(), addToContext: true });
    })
    .catch(function(err){
      logger.logServerWarn('Could not duplicate Entry', {error: err });
      notification.error('Could not duplicate Entry');
    });
  });

  createEntryCommand('archive', function () {
    return $scope.entry.archive()
    .then(function(){
      notification.info(title() + ' archived successfully');
    })
    .catch(function(err){
      notification.warn('Error archiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error archiving entry', {error: err });
    });
  });

  createEntryCommand('unarchive', function () {
    return $scope.entry.unarchive()
    .then(function(){
      notification.info(title() + ' unarchived successfully');
    })
    .catch(function(err){
      notification.warn('Error unarchiving ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error unarchiving entry', {error: err });
    });
  });

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

  createEntryCommand('unpublish', function () {
    return $scope.entry.unpublish()
    .then(function(){
      notification.info(title() + ' unpublished successfully');
      $scope.otUpdateEntity();
    })
    .catch(function(err){
      notification.warn('Error unpublishing ' + title() + ' (' + dotty.get(err, 'body.sys.id') + ')');
      logger.logServerWarn('Error unpublishing entry', {error: err });
    });
  });


  createEntryCommand('publish', publish, {
    label: getPublishCommandLabel
  });

  function publish () {
    var version = $scope.entry.getVersion();
    if (!$scope.validate()) {
      notification.warn('Error publishing ' + title() + ': ' + 'Validation failed');
      return $q.reject();
    }
    return $scope.entry.publish(version)
    .then(function(){
      $scope.entry.setPublishedVersion(version);
      if (trackedPreviousVersion === version) {
        trackedPreviousVersion = version + 1;
      }
      trackedPublishedVersion = version;
      notification.info(title() + ' published successfully');
    })
    .catch(handlePublishErrors);
  }


  function getPublishCommandLabel () {
    var isPublished = !!$scope.entry.getPublishedAt();
    if (isPublished) {
      return 'Republish';
    } else {
      return 'Publish';
    }
  }


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
      setValidationErrors(err);
      validationWarn('Validation failed');
    } else if (errorId === 'VersionMismatch'){
      validationWarn('Can only publish most recent version');
    } else if (errorId === 'UnresolvedLinks') {
      setValidationErrors(err);
      validationWarn('Some linked entries are missing.');
    } else if (errorId === 'InvalidEntry') {
      if (isLinkValidationError(err)) {
        validationWarn(getLinkValidationErrorMessage(err));
        setValidationErrors(err);
      } else if (err.body.message === 'Validation error') {
        setValidationErrors(err);
        validationWarn('Validation failed. Please check the individual fields for errors.');
      } else {
        validationWarn(err.body.message);
      }
    } else {
      logger.logServerWarn('Publishing the entry has failed due to a server issue. We have been notified.', {error: err });
      notification.error('Publishing the entry has failed due to a server issue. We have been notified.');
    }
  }

  function validationWarn(message) {
    notification.warn('Error publishing '+ title() +': '+ message);
  }

  function setValidationErrors(err) {
    $scope.setValidationErrors(dotty.get(err, 'body.details.errors'));
  }

  function isLinkValidationError(err) {
      var errors = dotty.get(err, 'body.details.errors');
      return err.body.message === 'Validation error' &&
             errors.length > 0 &&
             errors[0].name == 'linkContentType';
  }

  function getLinkValidationErrorMessage(err) {
    var error = _.first(dotty.get(err, 'body.details.errors'));
    var contentTypeId = _.first(error.contentTypeId);
    var contentType = _.findWhere($scope.spaceContext.publishedContentTypes, {data: {sys: {id: contentTypeId}}});
    if(contentType) {
      return error.details.replace(contentTypeId, contentType.data.name);
    } else {
      return 'This reference requires an entry of an unexistent content type';
    }
  }

}]);
