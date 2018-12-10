'use strict';

angular.module('contentful').controller('entityEditor/StateController', [
  '$scope',
  'require',
  'notify',
  'validator',
  'otDoc',
  function($scope, require, notify, validator, otDoc) {
    const controller = this;
    const $q = require('$q');
    const Command = require('command');
    const closeState = require('navigation/closeState');
    const _ = require('lodash');
    const publicationWarnings = require('app/entity_editor/PublicationWarnings.es6').create();
    const trackVersioning = require('analyticsEvents/versioning');
    const K = require('utils/kefir.es6');
    const N = require('app/entity_editor/Notifications.es6');
    const modalDialog = require('modalDialog');
    const Notification = N.Notification;
    const SumTypes = require('sum-types');
    const caseof = SumTypes.caseofEq;
    const otherwise = SumTypes.otherwise;
    const EntityState = require('data/CMA/EntityState.es6');
    const State = EntityState.State;
    const Action = EntityState.Action;
    const Analytics = require('analytics/Analytics.es6');
    const spaceContext = require('spaceContext');
    const onFeatureFlag = require('utils/LaunchDarkly').onFeatureFlag;
    const goToPreviousSlideOrExit = require('navigation/SlideInNavigator').goToPreviousSlideOrExit;
    const showUnpublishedRefsConfirm = require('app/entity_editor/UnpublishedReferencesConfirm/UnpublishedReferences.es6')
      .showConfirm;

    const permissions = otDoc.permissions;
    const reverter = otDoc.reverter;
    const docStateManager = otDoc.resourceState;

    // Is set to 'true' when the entity has been deleted by another user.
    let isDeleted = false;

    K.onValueScope($scope, docStateManager.inProgress$, inProgress => {
      controller.inProgress = inProgress;
    });

    const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG = 'feature-at-05-2018-sliding-entry-editor-multi-level';
    onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, flagState => {
      $scope.slideInFeatureFlagValue = flagState === 2 ? 2 : 0;
    });

    const noop = Command.create(() => {});

    const archive = Command.create(
      () => applyActionWithConfirmation(Action.Archive()),
      {
        disabled: checkDisallowed(Action.Archive())
      },
      {
        label: 'Archive',
        status: 'Archived',
        targetStateId: 'archived'
      }
    );

    const unarchive = Command.create(
      () => applyAction(Action.Unarchive()),
      {
        disabled: checkDisallowed(Action.Unarchive())
      },
      {
        label: 'Unarchive',
        status: 'Draft',
        targetStateId: 'draft'
      }
    );

    const unpublish = Command.create(
      () => applyActionWithConfirmation(Action.Unpublish()),
      {
        disabled: checkDisallowed(Action.Unpublish())
      },
      {
        label: 'Unpublish',
        status: 'Draft',
        targetStateId: 'draft'
      }
    );

    const publishChanges = Command.create(
      publishEntity,
      {
        disabled: checkDisallowed(Action.Publish())
      },
      {
        label: 'Publish changes',
        targetStateId: 'published'
      }
    );

    const publish = Command.create(
      publishEntity,
      {
        disabled: checkDisallowed(Action.Publish())
      },
      {
        label: 'Publish',
        status: 'Published',
        targetStateId: 'published'
      }
    );

    K.onValueScope($scope, docStateManager.state$, state => {
      caseof(state, [
        [
          State.Archived(),
          () => {
            controller.current = 'archived';
            controller.primary = unarchive;
            controller.secondary = [publish];
            controller.allActions = [unarchive, publish];
          }
        ],
        [
          State.Draft(),
          () => {
            controller.current = 'draft';
            controller.primary = publish;
            controller.secondary = [archive];
            controller.allActions = [publish, archive];
          }
        ],
        [
          State.Published(),
          () => {
            controller.current = 'published';
            controller.primary = noop;
            controller.secondary = [archive, unpublish];
            controller.allActions = [archive, unpublish];
          }
        ],
        [
          State.Changed(),
          () => {
            controller.current = 'changes';
            controller.primary = publishChanges;
            controller.secondary = [archive, unpublish];
            controller.allActions = [publishChanges, archive, unpublish];
          }
        ],
        [
          State.Deleted(),
          () => {
            isDeleted = true;
          }
        ]
      ]);

      controller.currentLabel = getStateLabel(state);

      controller.hidePrimary = state === State.Published();
    });

    $scope.$watch(
      () =>
        _.every(controller.secondary, (
          cmd // TODO this uses the private API
        ) => cmd._isDisabled()),
      secondaryActionsDisabled => {
        controller.secondaryActionsDisabled = secondaryActionsDisabled;
      }
    );

    controller.registerUnpublishedReferencesWarning = ({ getData }) =>
      publicationWarnings.register({
        group: 'unpublished_references',
        warnFn: unpublishedReferences => showUnpublishedRefsConfirm(unpublishedReferences),
        getData,
        shouldShow: ({ references }) => references.length > 0
      });

    function publishEntity() {
      return publicationWarnings
        .show()
        .then(() => {
          if (validator.run()) {
            let contentType;
            const entityInfo = $scope.entityInfo;
            if (entityInfo.type === 'Entry') {
              contentType = spaceContext.publishedCTs.get(entityInfo.contentTypeId);
            }
            const action = Action.Publish();
            return applyAction(action).then(
              entity => {
                if (contentType) {
                  let eventOrigin = 'entry-editor';

                  if ($scope.bulkEditorContext) {
                    eventOrigin = 'bulk-editor';
                  }

                  if ($scope.renderInline) {
                    eventOrigin = 'inline-reference-editor';
                  }

                  Analytics.track('entry:publish', {
                    eventOrigin: eventOrigin,
                    contentType: contentType,
                    response: { data: entity },
                    customWidgets: ($scope.widgets || [])
                      .filter(w => w.custom)
                      .map(w => w.trackingData)
                  });
                }
                trackVersioning.publishedRestored(entity);
              },
              error => {
                validator.setApiResponseErrors(error);
              }
            );
          } else {
            notify(Notification.ValidationError());
            return $q.reject();
          }
        })
        .catch(() => {});
    }

    controller.delete = Command.create(
      () =>
        applyActionWithConfirmation(Action.Delete()).then(() => {
          if ($scope.slideInFeatureFlagValue) {
            goToPreviousSlideOrExit($scope.slideInFeatureFlagValue, 'delete', closeState);
          } else {
            return closeState();
          }
        }),
      {
        disabled: function() {
          const canDelete = permissions.can('delete');
          const canMoveToDraft = caseof(controller.current, [
            ['archived', _.constant(permissions.can('unarchive'))],
            ['changes', 'published', _.constant(permissions.can('unpublish'))],
            [otherwise, _.constant(true)]
          ]);

          return isDeleted || !canDelete || !canMoveToDraft;
        }
      }
    );

    controller.revertToPrevious = Command.create(
      () => {
        reverter.revert().then(
          () => {
            notify(Notification.Success('revert'));
          },
          err => {
            notify(Notification.Error('revert', err));
          }
        );
      },
      {
        available: function() {
          const canEdit = K.getValue(otDoc.state.canEdit$);
          return canEdit && reverter.hasChanges();
        }
      }
    );

    function getStateLabel(state) {
      return caseof(state, [
        [State.Archived(), _.constant('archived')],
        [State.Draft(), _.constant('draft')],
        [State.Published(), _.constant('published')],
        [State.Changed(), _.constant('pending changes')],
        [State.Deleted(), _.constant('deleted')]
      ]);
    }

    function applyAction(action) {
      return docStateManager.apply(action).then(
        data => {
          notify(Notification.Success(action));
          return data;
        },
        err => {
          notify(Notification.Error(action, err));
          return $q.reject(err);
        }
      );
    }

    function applyActionWithConfirmation(action) {
      return showConfirmationMessage({ action: action }).then(() => applyAction(action));
    }

    // TODO Move these checks into the document resource manager
    function checkDisallowed(action) {
      return () => isDeleted || !permissions.can(action);
    }

    function showConfirmationMessage(props) {
      return modalDialog.open({
        template: '<cf-state-change-confirmation-dialog class="modal-background"/>',
        backgroundClose: true,
        scopeData: {
          action: props.action,
          entityInfo: $scope.entityInfo
        }
      }).promise;
    }
  }
]);
