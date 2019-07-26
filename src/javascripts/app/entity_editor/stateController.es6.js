import { registerController } from 'NgRegistry.es6';
import React from 'react';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import { caseofEq as caseof, otherwise } from 'sum-types';
import { State, Action } from 'data/CMA/EntityState.es6';
import { Notification } from 'app/entity_editor/Notifications.es6';
import { registerUnpublishedReferencesWarning } from 'app/entity_editor/PublicationWarnings/UnpublishedReferencesWarning/index.es6';
import * as trackVersioning from 'analytics/events/versioning.es6';
import ModalLauncher from 'app/common/ModalLauncher.es6';
import * as random from 'utils/Random.es6';

export default function register() {
  registerController('entityEditor/StateController', [
    '$scope',
    '$q',
    'notify',
    'validator',
    'otDoc',
    'command',
    'spaceContext',
    'analytics/Analytics.es6',
    'navigation/SlideInNavigator/index.es6',
    'app/entity_editor/PublicationWarnings/index.es6',
    'app/entity_editor/Components/StateChangeConfirmationDialog/index.es6',
    function(
      $scope,
      $q,
      notify,
      validator,
      otDoc,
      Command,
      spaceContext,
      Analytics,
      { goToPreviousSlideOrExit },
      { create: createPublicationWarnings },
      { default: StateChangeConfirmationDialog }
    ) {
      const controller = this;
      const permissions = otDoc.permissions;
      const reverter = otDoc.reverter;
      const docStateManager = otDoc.resourceState;
      const publicationWarnings = createPublicationWarnings();

      // Is set to 'true' when the entity has been deleted by another user.
      let isDeleted = false;

      K.onValueScope($scope, docStateManager.inProgress$, inProgress => {
        controller.inProgress = inProgress;
      });

      const noop = Command.create(() => {});

      const archive = Command.create(
        () => applyActionWithConfirmation(Action.Archive()),
        {
          disabled: checkDisallowed(Action.Archive()),
          restricted: checkRestricted(Action.Archive())
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
          disabled: checkDisallowed(Action.Unarchive()),
          restricted: checkRestricted(Action.Unarchive())
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
          disabled: checkDisallowed(Action.Unpublish()),
          restricted: checkRestricted(Action.Unpublish())
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
          disabled: checkDisallowed(Action.Publish()),
          restricted: checkRestricted(Action.Publish())
        },
        {
          label: 'Publish changes',
          targetStateId: 'published'
        }
      );

      const publish = Command.create(
        publishEntity,
        {
          disabled: checkDisallowed(Action.Publish()),
          restricted: checkRestricted(Action.Publish())
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

      controller.registerUnpublishedReferencesWarning = registerUnpublishedReferencesWarning(
        publicationWarnings
      );

      function publishEntity() {
        return publicationWarnings
          .show()
          .then(() => {
            if (validator.run()) {
              return applyAction(Action.Publish()).then(
                entity => {
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
                      response: entity
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
            goToPreviousSlideOrExit('delete');
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
            onConfirm={() => onClose(true)}
            onCancel={() => onClose(false)}
          />
        )).then(wasConfirmed => {
          if (wasConfirmed) return;
          return Promise.reject();
        });
      }
    }
  ]);
}
