'use strict';

angular.module('contentful')
.controller('EntryActionsController', ['$scope', '$injector', function EntryActionsController($scope, $injector) {

  var controller          = this;
  var $rootScope          = $injector.get('$rootScope');
  var $q                  = $injector.get('$q');
  var notifier            = $injector.get('entryEditor/notifications');
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

}]);
