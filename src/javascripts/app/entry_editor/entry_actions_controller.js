'use strict';

angular.module('contentful')
.controller('EntryActionsController', ['$scope', '$injector', function EntryActionsController($scope, $injector) {

  var controller          = this;
  var $rootScope          = $injector.get('$rootScope');
  var $q                  = $injector.get('$q');
  var notifier            = $injector.get('entryActions/notifications');
  var moment              = $injector.get('moment');
  var Command             = $injector.get('command');
  var createEntryReverter = $injector.get('entryReverter');

  var entryReverter = createEntryReverter(function () {
    return $scope.entry;
  });


  var notify = notifier(function () {
    return '“' + $scope.title + '”';
  });

  function createEntryCommand (action, run, extension) {
    var can = function () {
      return $scope.entityActionsController.can(action);
    };

    controller[action] = Command.create(run, {available: can}, extension);
  }

  createEntryCommand('delete', function () {
    return $scope.entry.delete()
    .then(function(entry){
      notify.deleteSuccess();
      $rootScope.$broadcast('entityDeleted', entry);
    })
    .catch(notify.deleteFail);
  });


  createEntryCommand('duplicate', function () {
    var contentType = $scope.entry.getSys().contentType.sys.id;
    var data = _.omit($scope.entry.data, 'sys');

    return $scope.spaceContext.space.createEntry(contentType, data)
    .then(function(entry){
      $scope.$state.go('spaces.detail.entries.detail', { entryId: entry.getId(), addToContext: true });
    })
    .catch(notify.duplicateFail);
  });

  createEntryCommand('archive', function () {
    return $scope.entry.archive()
    .then(notify.archiveSuccess, notify.archiveFail);
  });

  createEntryCommand('unarchive', function () {
    return $scope.entry.unarchive()
    .then(notify.unarchiveSuccess, notify.unarchiveFail);
  });


  var unwatchRevertSetup = $scope.$watch('otDoc.state.editable', function (editable) {
    if (!editable) { return; }

    var entry = $scope.otDoc.getEntity();
    entryReverter.init();

    controller.revertToPublished.publishedAt = moment(entry.getPublishedAt()).format('h:mma [on] MMM DD, YYYY');
    controller.revertToPrevious.updatedAt = moment(entry.getUpdatedAt()).format('h:mma [on] MMM DD, YYYY');

    unwatchRevertSetup();
  });


  controller.revertToPublished = Command.create(function () {
    $scope.entry.getPublishedState().then(function (data) {
      return setDocFields($scope.otDoc.doc, data.fields);
    }).then(function () {
      $scope.otDoc.updateEntityData();
      entryReverter.revertedToPublished();
    })
    .then(notify.revertToPublishedSuccess, notify.revertToPublishedFail);
  }, {
    available: function () {
      return $scope.entityActionsController.canUpdate() &&
             entryReverter.canRevertToPublished();
    }
  });

  controller.revertToPrevious = Command.create(function () {
    if(!$scope.otDoc.doc) {
      return $q.when();
    }
    return setDocFields($scope.otDoc.doc, entryReverter.getPreviousData().fields)
    .then(function () {
      $scope.otDoc.updateEntityData();
      entryReverter.revertedToPrevious();
    })
    .then(notify.revertToPreviousSuccess, notify.revertToPreviousFail);
  }, {
    available: function () {
      return $scope.entityActionsController.canUpdate() &&
             entryReverter.canRevertToPrevious();
    }
  });

  function setDocFields (doc, data) {
    return $q.denodeify(function (handler) {
      doc.at('fields').set(data, handler);
    });
  }

  createEntryCommand('unpublish', function () {
    return $scope.entry.unpublish()
    .then(function(){
      $scope.otDoc.updateEntityData();
      notify.unpublishSuccess();
    })
    .catch(notify.unpublishFail);
  });


  createEntryCommand('publish', publish, {
    label: getPublishCommandLabel
  });

  function publish () {
    if (!$scope.validate()) {
      notify.publishValidationFail();
      return $q.reject();
    }
    return $scope.entry.publish()
    .then(entryReverter.publishedNewVersion)
    .then(notify.publishSuccess, handlePublishErrors);
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
      notify.publishValidationFail();
    } else if (errorId === 'VersionMismatch'){
      notify.publishFail('Can only publish most recent version');
    } else if (errorId === 'UnresolvedLinks') {
      setValidationErrors(err);
      notify.publishFail('Some linked entries are missing.');
    } else if (errorId === 'InvalidEntry') {
      if (isLinkValidationError(err)) {
        notify.publishFail(getLinkValidationErrorMessage(err));
        setValidationErrors(err);
      } else if (err.body.message === 'Validation error') {
        setValidationErrors(err);
        notify.publishValidationFail();
      } else {
        notify.publishServerFail(err);
      }
    } else {
      notify.publishServerFail(err);
    }
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

}])

.factory('entryActions/notifications', ['$injector', function ($injector) {
  var logger       = $injector.get('logger');
  var notification = $injector.get('notification');

  return function (getTitle) {
    return {
      archiveSuccess: function () {
        notification.info(getTitle() + ' archived successfully');
      },

      archiveFail: function (error) {
        notification.error('Error archiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error archiving entry', {error: error });
      },

      unarchiveSuccess: function () {
        notification.info(getTitle() + ' unarchived successfully');
      },

      unarchiveFail: function (error) {
        notification.error('Error unarchiving ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unarchiving entry', {error: error });
      },

      duplicateFail: function (error) {
        notification.error('Could not duplicate Entry');
        logger.logServerWarn('Could not duplicate Entry', {error: error });
      },

      deleteSuccess: function () {
        notification.info('Entry deleted successfully');
      },

      deleteFail: function (error) {
        notification.error('Error deleting Entry');
        logger.logServerWarn('Error deleting Entry', {error: error });
      },

      revertToPublishedSuccess: function () {
        notification.info('Entry reverted to the last published state successfully');
      },

      revertToPublishedFail: function (error) {
        notification.error('Error reverting to the last published state of ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logSharejsWarn('Error reverting entry to published state', {error: error});
      },

      revertToPreviousSuccess: function () {
        notification.info('Entry reverted to the previous state successfully');
      },

      revertToPreviousFail: function (error) {
        notification.error('Error reverting to the previous state of ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logSharejsWarn('Error reverting entry to previous state', {error: error});
      },

      unpublishSuccess: function () {
        notification.info(getTitle() + ' unpublished successfully');
      },

      unpublishFail: function (error) {
        notification.error('Error unpublishing ' + getTitle() + ' (' + dotty.get(error, 'body.sys.id') + ')');
        logger.logServerWarn('Error unpublishing entry', {error: error });
      },

      publishSuccess: function () {
        notification.info(getTitle() + ' published successfully');
      },

      publishServerFail: function (error) {
        notification.error('Publishing the entry has failed due to a server issue. We have been notified.');
        logger.logServerWarn('Publishing the entry has failed due to a server issue. We have been notified.', {error: error });
      },

      publishFail: function (message) {
        notification.error('Error publishing ' + getTitle() + ': ' + message);
      },

      publishValidationFail: function () {
        notification.error('Error publishing ' + getTitle() + ': ' + 'Validation failed. ' +
                           'Please check the individual fields for errors.');
      }

    };
  };
}]);
