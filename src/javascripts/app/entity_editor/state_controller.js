'use strict';

angular.module('contentful')
.controller('entityEditor/StateController', ['$scope', 'require', 'notify', 'validator', 'otDoc', function ($scope, require, notify, validator, otDoc) {
  var controller = this;
  var $q = require('$q');
  var Command = require('command');
  var closeState = require('navigation/closeState');
  var _ = require('lodash');
  var publicationWarnings = require('entityEditor/publicationWarnings').create();
  var trackVersioning = require('analyticsEvents/versioning');
  var K = require('utils/kefir');
  var N = require('app/entity_editor/Notifications');
  var modalDialog = require('modalDialog');
  var Notification = N.Notification;
  var SumTypes = require('sum-types');
  var caseof = SumTypes.caseofEq;
  var otherwise = SumTypes.otherwise;
  var EntityState = require('data/CMA/EntityState');
  var State = EntityState.State;
  var Action = EntityState.Action;
  var Analytics = require('analytics/Analytics');
  var spaceContext = require('spaceContext');
  var onFeatureFlag = require('utils/LaunchDarkly').onFeatureFlag;
  var goToPreviousSlideOrExit =
    require('states/EntityNavigationHelpers').goToPreviousSlideOrExit;

  var permissions = otDoc.permissions;
  var reverter = otDoc.reverter;
  var docStateManager = otDoc.resourceState;

  // Is set to 'true' when the entity has been deleted by another user.
  var isDeleted = false;

  K.onValueScope($scope, docStateManager.inProgress$, function (inProgress) {
    controller.inProgress = inProgress;
  });

  const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG = 'feature-at-05-2018-sliding-entry-editor-multi-level';
  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, function (value) {
    $scope.slideInFeatureFlagValue = value;
  });

  var noop = Command.create(function () {});

  var archive = Command.create(function () {
    return applyActionWithConfirmation(Action.Archive());
  }, {
    disabled: checkDisallowed(Action.Archive())
  }, {
    label: 'Archive',
    status: 'Archived',
    targetStateId: 'archived'
  });

  var unarchive = Command.create(function () {
    return applyAction(Action.Unarchive());
  }, {
    disabled: checkDisallowed(Action.Unarchive())
  }, {
    label: 'Unarchive',
    status: 'Draft',
    targetStateId: 'draft'
  });


  var unpublish = Command.create(function () {
    return applyActionWithConfirmation(Action.Unpublish());
  }, {
    disabled: checkDisallowed(Action.Unpublish())
  }, {
    label: 'Unpublish',
    status: 'Draft',
    targetStateId: 'draft'
  });

  var publishChanges = Command.create(publishEntity, {
    disabled: checkDisallowed(Action.Publish())
  }, {
    label: 'Publish changes',
    targetStateId: 'published'
  });

  var publish = Command.create(publishEntity, {
    disabled: checkDisallowed(Action.Publish())
  }, {
    label: 'Publish',
    status: 'Published',
    targetStateId: 'published'
  });

  K.onValueScope($scope, docStateManager.state$, function (state) {
    caseof(state, [
      [State.Archived(), function () {
        controller.current = 'archived';
        controller.primary = unarchive;
        controller.secondary = [publish];
        controller.allActions = [unarchive, publish];
      }],
      [State.Draft(), function () {
        controller.current = 'draft';
        controller.primary = publish;
        controller.secondary = [archive];
        controller.allActions = [publish, archive];
      }],
      [State.Published(), function () {
        controller.current = 'published';
        controller.primary = noop;
        controller.secondary = [archive, unpublish];
        controller.allActions = [archive, unpublish];
      }],
      [State.Changed(), function () {
        controller.current = 'changes';
        controller.primary = publishChanges;
        controller.secondary = [archive, unpublish];
        controller.allActions = [publishChanges, archive, unpublish];
      }],
      [State.Deleted(), function () {
        isDeleted = true;
      }]
    ]);

    controller.currentLabel = getStateLabel(state);

    controller.hidePrimary = state === State.Published();
  });

  $scope.$watch(function () {
    return _.every(controller.secondary, function (cmd) {
      // TODO this uses the private API
      return cmd._isDisabled();
    });
  }, function (secondaryActionsDisabled) {
    controller.secondaryActionsDisabled = secondaryActionsDisabled;
  });


  controller.registerPublicationWarning = publicationWarnings.register;

  function publishEntity () {
    return publicationWarnings.show()
    .then(function () {
      if (validator.run()) {
        var contentType;
        var entityInfo = $scope.entityInfo;
        if (entityInfo.type === 'Entry') {
          contentType = spaceContext.publishedCTs.get(entityInfo.contentTypeId);
        }
        var action = Action.Publish();
        return applyAction(action)
        .then(function (entity) {
          if (contentType) {
            var eventOrigin = 'entry-editor';

            if ($scope.bulkEditorContext) {
              eventOrigin = 'bulk-editor';
            }

            if ($scope.renderInline) {
              eventOrigin = 'inline-reference-editor';
            }

            Analytics.track('entry:publish', {
              eventOrigin: eventOrigin,
              contentType: contentType,
              response: { data: entity }
            });
          }
          trackVersioning.publishedRestored(entity);
        }, function (error) {
          validator.setApiResponseErrors(error);
        });
      } else {
        notify(Notification.ValidationError());
        return $q.reject();
      }
    });
  }

  controller.delete = Command.create(
    function () {
      return applyActionWithConfirmation(Action.Delete()).then(function () {
        if ($scope.slideInFeatureFlagValue) {
          goToPreviousSlideOrExit(
            $scope.slideInFeatureFlagValue,
            'delete',
            closeState
          );
        } else {
          return closeState();
        }
      });
    },
    {
      disabled: function () {
        var canDelete = permissions.can('delete');
        var canMoveToDraft = caseof(controller.current, [
          ['archived', _.constant(permissions.can('unarchive'))],
          ['changes', 'published', _.constant(permissions.can('unpublish'))],
          [otherwise, _.constant(true)]
        ]);

        return isDeleted || !canDelete || !canMoveToDraft;
      }
    }
  );

  controller.revertToPrevious = Command.create(function () {
    reverter.revert()
    .then(function () {
      notify(Notification.Success('revert'));
    }, function (err) {
      notify(Notification.Error('revert', err));
    });
  }, {
    available: function () {
      var canEdit = K.getValue(otDoc.state.canEdit$);
      return canEdit && reverter.hasChanges();
    }
  });


  function getStateLabel (state) {
    return caseof(state, [
      [State.Archived(), _.constant('archived')],
      [State.Draft(), _.constant('draft')],
      [State.Published(), _.constant('published')],
      [State.Changed(), _.constant('pending changes')],
      [State.Deleted(), _.constant('deleted')]
    ]);
  }


  function applyAction (action) {
    return docStateManager.apply(action)
    .then(function (data) {
      notify(Notification.Success(action));
      return data;
    }, function (err) {
      notify(Notification.Error(action, err));
      return $q.reject(err);
    });
  }

  function applyActionWithConfirmation (action) {
    return showConfirmationMessage({ action: action })
      .then(function () {
        return applyAction(action);
      });
  }

  // TODO Move these checks into the document resource manager
  function checkDisallowed (action) {
    return function () {
      return isDeleted || !permissions.can(action);
    };
  }

  function showConfirmationMessage (props) {
    return modalDialog.open({
      template: '<cf-state-change-confirmation-dialog class="modal-background"/>',
      backgroundClose: true,
      scopeData: {
        action: props.action,
        entityInfo: $scope.entityInfo
      }
    }).promise;
  }
}]);
