import { registerController } from 'core/NgRegistry';
import React from 'react';
import _ from 'lodash';
import * as K from 'utils/kefir';
import { caseofEq as caseof, otherwise } from 'sum-types';
import { State, Action } from 'data/CMA/EntityState';
import { Notification } from 'app/entity_editor/Notifications';

import * as trackVersioning from 'analytics/events/versioning';
import { ModalLauncher } from 'core/components/ModalLauncher';
import * as random from 'utils/Random';

import StateChangeConfirmationDialog from 'app/entity_editor/Components/StateChangeConfirmationDialog';
import { showUnpublishedReferencesWarning } from 'app/entity_editor/UnpublishedReferencesWarning';
import { goToPreviousSlideOrExit } from 'navigation/SlideInNavigator';
import * as Analytics from 'analytics/Analytics';
import { createCommand } from 'utils/command/command';

export default function register() {
  registerController('entityEditor/StateController', [
    '$scope',
    'notify',
    'validator',
    'otDoc',
    'spaceContext',
    function EntityEditorStateController($scope, notify, validator, otDoc, spaceContext) {
      const controller = this;
      const permissions = otDoc.permissions;
      const reverter = otDoc.reverter;
      const docStateManager = otDoc.resourceState;

      // Is set to 'true' when the entity has been deleted by another user.
      let isDeleted = false;

      K.onValueScope($scope, docStateManager.inProgress$, (inProgress) => {
        controller.inProgress = inProgress;
      });

      const noop = createCommand(() => {});

      const archive = createCommand(
        () => applyActionWithConfirmation(Action.Archive()),
        {
          disabled: checkDisallowed(Action.Archive()),
          restricted: checkRestricted(Action.Archive()),
        },
        {
          label: 'Archive',
          status: 'Archived',
          targetStateId: 'archived',
        }
      );

      const unarchive = createCommand(
        () => applyAction(Action.Unarchive()),
        {
          disabled: checkDisallowed(Action.Unarchive()),
          restricted: checkRestricted(Action.Unarchive()),
        },
        {
          label: 'Unarchive',
          status: 'Draft',
          targetStateId: 'draft',
        }
      );

      const unpublish = createCommand(
        () => applyActionWithConfirmation(Action.Unpublish()),
        {
          disabled: checkDisallowed(Action.Unpublish()),
          restricted: checkRestricted(Action.Unpublish()),
        },
        {
          label: 'Unpublish',
          status: 'Draft',
          targetStateId: 'draft',
        }
      );

      const publishChanges = createCommand(
        publishEntity,
        {
          disabled: checkDisallowed(Action.Publish()),
          restricted: checkRestricted(Action.Publish()),
        },
        {
          label: 'Publish changes',
          targetStateId: 'published',
        }
      );

      const publish = createCommand(
        publishEntity,
        {
          disabled: checkDisallowed(Action.Publish()),
          restricted: checkRestricted(Action.Publish()),
        },
        {
          label: 'Publish',
          status: 'Published',
          targetStateId: 'published',
        }
      );

      K.onValueScope($scope, docStateManager.state$, (state) => {
        caseof(state, [
          [
            State.Archived(),
            () => {
              controller.current = 'archived';
              controller.primary = unarchive;
              controller.secondary = [publish];
              controller.allActions = [unarchive, publish];
            },
          ],
          [
            State.Draft(),
            () => {
              controller.current = 'draft';
              controller.primary = publish;
              controller.secondary = [archive];
              controller.allActions = [publish, archive];
            },
          ],
          [
            State.Published(),
            () => {
              controller.current = 'published';
              controller.primary = noop;
              controller.secondary = [unpublish, archive];
              controller.allActions = [unpublish, archive];
            },
          ],
          [
            State.Changed(),
            () => {
              controller.current = 'changes';
              controller.primary = publishChanges;
              controller.secondary = [unpublish, archive];
              controller.allActions = [publishChanges, unpublish, archive];
            },
          ],
          [
            State.Deleted(),
            () => {
              isDeleted = true;
            },
          ],
        ]);

        controller.currentLabel = getStateLabel(state);

        controller.hidePrimary = state === State.Published();
      });

      $scope.$watch(
        () =>
          _.every(controller.secondary, (
            cmd // TODO this uses the private API
          ) => cmd._isDisabled()),
        (secondaryActionsDisabled) => {
          controller.secondaryActionsDisabled = secondaryActionsDisabled;
        }
      );

      function publishEntity() {
        return showUnpublishedReferencesWarning({
          entity: K.getValue(otDoc.data$),
          spaceId: spaceContext.getId(),
          environmentId: spaceContext.getEnvironmentId(),
        })
          .then(() => {
            if (validator.run()) {
              return applyAction(Action.Publish()).then(
                ({ entity }) => {
                  const entityInfo = $scope.entityInfo;
                  let contentType;
                  if (entityInfo.type === 'Entry') {
                    contentType = spaceContext.publishedCTs.get(entityInfo.contentTypeId).data;
                  }
                  if (contentType) {
                    let eventOrigin = 'entry-editor';

                    if ($scope.bulkEditorContext) {
                      eventOrigin = 'bulk-editor';
                    }

                    const widgetTrackingContexts = _.get(
                      $scope,
                      ['editorData', 'widgetTrackingContexts'],
                      []
                    );
                    Analytics.track('entry:publish', {
                      eventOrigin,
                      widgetTrackingContexts,
                      contentType: contentType,
                      response: entity,
                    });
                  }
                  trackVersioning.publishedRestored(entity);
                },
                (error) => {
                  validator.setApiResponseErrors(error);
                }
              );
            } else {
              notify(Notification.ValidationError());
              return Promise.reject();
            }
          })
          .catch(() => {});
      }

      controller.delete = createCommand(
        () =>
          applyActionWithConfirmation(Action.Delete()).then(({ action }) => {
            if (action !== Action.Archive()) {
              goToPreviousSlideOrExit('delete');
            }
          }),
        {
          disabled: function () {
            const canDelete = permissions.can('delete');
            const canMoveToDraft = caseof(controller.current, [
              ['archived', _.constant(permissions.can('unarchive'))],
              ['changes', 'published', _.constant(permissions.can('unpublish'))],
              [otherwise, _.constant(true)],
            ]);

            return isDeleted || !canDelete || !canMoveToDraft;
          },
        }
      );

      controller.revertToPrevious = createCommand(
        () => {
          reverter
            .revert()
            .then(
              () => {
                notify(Notification.Success('revert'));
              },
              (err) => {
                notify(Notification.Error('revert', err));
              }
            )
            .then(() => {
              Analytics.track('entity_state:revert', {
                id: $scope.entityInfo.id,
                type: $scope.entityInfo.type,
              });
            });
        },
        {
          available: function () {
            const canEdit = K.getValue(otDoc.state.canEdit$);
            return canEdit && reverter.hasChanges();
          },
        }
      );

      function getStateLabel(state) {
        return caseof(state, [
          [State.Archived(), _.constant('archived')],
          [State.Draft(), _.constant('draft')],
          [State.Published(), _.constant('published')],
          [State.Changed(), _.constant('changed')],
          [State.Deleted(), _.constant('deleted')],
        ]);
      }

      function applyAction(action) {
        return docStateManager.apply(action).then(
          (data) => {
            notify(Notification.Success(action));
            return { action, entity: data };
          },
          (err) => {
            notify(Notification.Error(action, err));
            return Promise.reject(err);
          }
        );
      }

      function applyActionWithConfirmation(action) {
        return showConfirmationMessage({ action }).then((payload) =>
          applyAction(_.get(payload, 'action', action))
        );
      }

      // TODO Move these checks into the document resource manager
      function checkDisallowed(action) {
        return () => isDeleted || !permissions.can(action);
      }

      function checkRestricted(action) {
        return () => !permissions.can(action);
      }

      function showConfirmationMessage(props) {
        return ModalLauncher.open(({ isShown, onClose }) => (
          <StateChangeConfirmationDialog
            dialogSessionId={random.id()}
            isShown={isShown}
            action={props.action}
            entityInfo={$scope.entityInfo}
            onConfirm={() => onClose({ action: props.action })}
            onCancel={() => onClose({ action: null })}
            onArchive={() => onClose({ action: Action.Archive() })}
          />
        )).then((result) => {
          if (result.action) return result;
          return Promise.reject();
        });
      }
    },
  ]);
}
