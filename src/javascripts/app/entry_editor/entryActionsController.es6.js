import { registerController } from 'NgRegistry.es6';
import * as K from 'utils/kefir.es6';
import { Notification } from 'app/entity_editor/Notifications.es6';

export default function register() {
  registerController('EntryActionsController', [
    '$scope',
    '$state',
    'notify',
    'fields$',
    'entityInfo',
    'preferences',
    'spaceContext',
    'command', // Command
    'analytics/Analytics.es6', // Analytics
    'access_control/AccessChecker/index.es6', // accessChecker
    function(
      $scope,
      $state,
      notify,
      fields$,
      entityInfo,
      preferences,
      spaceContext,
      Command,
      Analytics,
      accessChecker
    ) {
      const controller = this;
      let currentFields;
      K.onValueScope($scope, fields$, fields => {
        currentFields = fields;
      });

      controller.toggleDisabledFields = Command.create(
        () => {
          const show = !preferences.showDisabledFields;
          preferences.showDisabledFields = show;
          Analytics.track('entry_editor:disabled_fields_visibility_toggled', {
            entryId: entityInfo.id,
            show: show
          });
        },
        {},
        {
          label: function() {
            return preferences.showDisabledFields ? 'Hide disabled fields' : 'Show disabled fields';
          }
        }
      );

      // Command options for the #add and #duplicate actions
      const options = {
        disabled: function() {
          return !canCreateEntry();
        }
      };

      controller.add = Command.create(
        () => {
          const contentType = getContentType(entityInfo);
          Analytics.track('entry_editor:created_with_same_ct', {
            contentTypeId: contentType.id,
            entryId: entityInfo.id
          });
          return spaceContext.space
            .createEntry(contentType.id, {})
            .then(goToEntryDetailWithTracking(contentType.type))
            .catch(() => {
              notify(Notification.Error('add'));
            });
        },
        options,
        {
          name: function() {
            return entityInfo.contentType.name;
          }
        }
      );

      controller.duplicate = Command.create(() => {
        const contentType = getContentType(entityInfo);
        return spaceContext.space
          .createEntry(contentType.id, {
            fields: currentFields
          })
          .then(goToEntryDetailWithTracking(contentType.type, { duplicate: true }))
          .catch(() => {
            notify(Notification.Error('duplicate'));
          });
      }, options);

      function goToEntryDetailWithTracking(contentType, options) {
        const eventOrigin =
          options && options.duplicate ? 'entry-editor__duplicate' : 'entry-editor';
        return entry => {
          trackEntryCreation(eventOrigin, contentType, entry);
          goToEntryDetail(entry);
        };
      }

      function getContentType(entityInfo) {
        const contentTypeId = entityInfo.contentTypeId;
        return {
          id: contentTypeId,
          type: spaceContext.publishedCTs.get(contentTypeId)
        };
      }

      function trackEntryCreation(eventOrigin, contentType, response) {
        Analytics.track('entry:create', {
          eventOrigin: eventOrigin,
          contentType: contentType,
          response: response
        });
      }

      function goToEntryDetail(entry) {
        $state.go('^.detail', {
          entryId: entry.getId(),
          previousEntries: '',
          addToContext: false
        });
      }

      function canCreateEntry() {
        return accessChecker.canPerformActionOnEntryOfType('create', entityInfo.contentTypeId);
      }
    }
  ]);
}
