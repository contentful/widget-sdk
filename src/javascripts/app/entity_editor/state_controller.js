'use strict';

angular.module('contentful')
.controller('entityEditor/StateController',
['$scope', '$injector', 'entity', 'notify', 'handlePublishError',
function ($scope, $injector, entity, notify, handlePublishError) {

  var controller          = this;
  var $rootScope          = $injector.get('$rootScope');
  var $q                  = $injector.get('$q');
  var Command             = $injector.get('command');
  var createEntryReverter = $injector.get('entryReverter');
  var StateManager        = $injector.get('EntityStateManager');
  var analytics           = $injector.get('analytics');
  var accessChecker       = $injector.get('accessChecker');

  var stateManager = new StateManager(entity);

  /**
   * @ngdoc analytics-event
   * @name Changed Entity State
   * @param {string} from
   * @param {string} to
   */
  stateManager.changedEditingState.attach(function (from, to) {
    analytics.track('Changed Entity State', {
      from: from,
      to: to
    });
  });

  // TODO we do not need to pass a function here.
  var entryReverter = createEntryReverter(function () {
    return entity;
  });

  function hasPermission (action) {
    // TODO this should be moved to a service with a simpler interface
    return accessChecker.canPerformActionOnEntity(action, entity);
  }

  function disabledChecker (action) {
    return function () {
      return !hasPermission(action);
    };
  }


  $scope.$watch(function () {
    return stateManager.getEditingState();
  }, function (state) {
    controller.current = state;
    switch (state) {
      case 'archived':
        controller.primary = unarchive;
        controller.secondary = [publish];
        break;
      case 'draft':
        controller.primary = publish;
        controller.secondary = [archive];
        break;
      case 'published':
        controller.primary = noop;
        controller.secondary = [archive, unpublish];
        break;
      case 'changes':
        controller.primary = publishChanges;
        controller.secondary = [archive, unpublish];
        break;
    }

    if (state === 'published') {
      controller.hidePrimary = true;
    } else {
      controller.hidePrimary = false;
    }
  });

  $scope.$watch(function () {
    return _.all(controller.secondary, function (cmd) {
      // TODO this uses the private API
      return cmd._isDisabled();
    });
  }, function (secondaryActionsDisabled) {
    controller.secondaryActionsDisabled = secondaryActionsDisabled;
  });

  var noop = Command.create(function () {});

  var archive = Command.create(function () {
    return stateManager.archive()
    .then(notify.archiveSuccess, notify.archiveFail);
  }, {
    disabled: disabledChecker('archive')
  }, {
    label: 'Archive',
    status: 'Archived',
    targetStateId: 'archived',
  });

  var unarchive = Command.create(function () {
    return stateManager.toDraft()
    .then(notify.unarchiveSuccess, notify.unarchiveFail);
  }, {
    disabled: disabledChecker('archive')
  }, {
    label: 'Unarchive',
    status: 'Draft',
    targetStateId: 'draft',
  });


  var unpublish = Command.create(function () {
    return stateManager.toDraft()
    .then(notify.unpublishSuccess, notify.unpublishFail);
  }, {
    disabled: disabledChecker('publish')
  }, {
    label: 'Unpublish',
    status: 'Draft',
    targetStateId: 'draft',
  });

  var publishChanges = Command.create(publishEntity, {
    disabled: disabledChecker('publish')
  }, {
    label: 'Publish changes',
    targetStateId: 'published',
  });

  var publish = Command.create(publishEntity, {
    disabled: disabledChecker('publish')
  }, {
    label: 'Publish',
    status: 'Published',
    targetStateId: 'published',
  });

  function publishEntity () {
    if (!$scope.validate()) {
      notify.publishValidationFail();
      return $q.reject();
    }

    return stateManager.publish()
    .then(entryReverter.publishedNewVersion)
    .then(notify.publishSuccess, handlePublishError);
  }

  controller.delete = Command.create(function () {
    return stateManager.delete()
    .then(function(){
      $scope.closeState();

      // TODO this is probably not needed: All listeners are in the
      // Entity list controllers, but those are never active when this
      // controller is active.
      $rootScope.$broadcast('entityDeleted', entity);
    })
    .then(notify.deleteSuccess, notify.deleteFail);
  }, {
    disabled: disabledChecker('delete')
  });


  var unwatchRevertSetup = $scope.$watch('otDoc.state.editable', function (editable) {
    if (!editable) { return; }
    entryReverter.init();
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
      return hasPermission('update') &&
             !entity.isArchived() &&
             entryReverter.canRevertToPublished();
    }
  });

  controller.revertToPrevious = Command.create(function () {
    if(!$scope.otDoc.doc) {
      return $q.when();
    }
    var fields = entryReverter.getPreviousData().fields;
    return setDocFields($scope.otDoc.doc, fields)
    .then(function () {
      $scope.otDoc.updateEntityData();
      entryReverter.revertedToPrevious();
    })
    .then(notify.revertToPreviousSuccess, notify.revertToPreviousFail);
  }, {
    available: function () {
      return hasPermission('update') &&
             !entity.isArchived() &&
             entryReverter.canRevertToPrevious();
    }
  });

  function setDocFields (doc, data) {
    return $q.denodeify(function (handler) {
      doc.at('fields').set(data, handler);
    });
  }

}]);
