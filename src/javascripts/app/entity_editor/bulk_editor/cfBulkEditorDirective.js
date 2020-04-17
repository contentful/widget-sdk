import { registerDirective } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'utils/kefir';
import { deepFreeze } from 'utils/Freeze';
import * as List from 'utils/List';

import * as localeData from 'app/entity_editor/setLocaleData';
import * as accessChecker from 'access_control/AccessChecker';
import * as Analytics from 'analytics/Analytics';
import * as DataLoader from 'app/entity_editor/DataLoader';
import * as Tracking from 'app/entity_editor/bulk_editor/Tracking';
import * as entitySelector from 'search/EntitySelector/entitySelector';

import bulkEditorTemplate from './bulk_editor.html';

export default function register() {
  registerDirective('cfBulkEditor', [
    'spaceContext',
    (spaceContext) => {
      return {
        scope: {
          referenceContext: '=',
        },
        restrict: 'E',
        template: bulkEditorTemplate,
        link,
      };

      function link($scope) {
        const { referenceContext, trackLoadEvent } = $scope;

        localeData.setLocaleData($scope, { isBulkEditor: true });

        const templateData = {};
        $scope.data = templateData;

        let nextFocusIndex = referenceContext.focusIndex;
        let initialLoadCount = null;

        const scrollTargetBus = K.createBus($scope);

        const track = Tracking.create(referenceContext.parentId, referenceContext.links$);

        track.open();
        $scope.$on('$destroy', track.close);

        // Property<string>
        // List of IDs for the linked entries
        const ids$ = referenceContext.links$.map((links) => {
          links = Array.isArray(links) ? links : [links];
          return links.map(_.property('sys.id')).filter(_.isString);
        });

        // Each of these contexts is passed to a cfBulkEntityEditor
        // directive.
        const entityContexts$ = ids$.map((ids) =>
          List.makeKeyed(ids, _.identity).map((item) =>
            deepFreeze({
              id: item.value,
              remove: _.partial(removeByKey, item.key),
              key: item.key,
            })
          )
        );

        K.onValueScope($scope, entityContexts$, (ctxs) => {
          $scope.entityContexts = ctxs;
          templateData.linkCount = ctxs.length;
        });

        // The initial count helps us figure out when to remove the global
        // loader.
        K.onValueScope($scope, entityContexts$.take(1), (ctxs) => {
          initialLoadCount = ctxs.length;
        });

        const loadEditorData = DataLoader.makePrefetchEntryLoader(spaceContext, ids$);
        // Passed to cfBulkEntityEditor directive
        $scope.editorContext = {
          editorSettings: referenceContext.editorSettings,
          scrollTarget$: scrollTargetBus.stream,
          initializedEditor: function () {
            initialLoadCount--;
            if (initialLoadCount < 1) {
              templateData.loaded = true;
              $scope.$applyAsync(forceFocus);
            }
          },
          track,
          trackLoadEvent,
          loadEditorData,
        };

        $scope.actions = makeActions(
          referenceContext.field,
          addLinks,
          referenceContext.links$,
          track
        );

        $scope.newCloseWithReason = (reason) => () => {
          referenceContext.close(reason);
        };

        function addLinks(links) {
          nextFocusIndex = -1;
          return Promise.all(links.map((link) => referenceContext.add(link)));
        }

        function removeByKey(key) {
          const index = _.findIndex($scope.entityContexts, { key: key });
          if (index > -1) {
            referenceContext.remove(index);
          }
        }

        function forceFocus() {
          if (nextFocusIndex === null) {
            return;
          }
          const focusIndex =
            nextFocusIndex < 0 ? $scope.entityContexts.length + nextFocusIndex : nextFocusIndex;
          const focusContext = $scope.entityContexts[focusIndex];
          if (focusContext) {
            scrollTargetBus.emit(focusContext.key);
          }
          nextFocusIndex = null;
        }
      }

      /**
       * Returns the actions for creating new entries and adding existing entries.
       */
      function makeActions(field, addLinks, links$, track) {
        // TODO necessary for entitySelector change it
        const extendedField = _.extend({}, field, {
          itemLinkType: _.get(field, ['items', 'linkType']),
          itemValidations: _.get(field, ['items', 'validations'], []),
        });
        const allowedCTs = getAllowedCTs(extendedField);
        const accessibleCTs = allowedCTs.map((ct) => ({
          id: ct.sys.id,
          name: ct.name,
        }));

        return {
          allowedCTs: allowedCTs, // For new "Add entry" button behind feature flag.
          accessibleCTs: accessibleCTs, // For legacy "Add entry" button.
          addNewEntry: addNewEntry,
          addExistingEntries: addExistingEntries,
        };

        function addNewEntry(ctOrCtId) {
          const contentType = _.isObject(ctOrCtId)
            ? ctOrCtId
            : spaceContext.publishedCTs.get(ctOrCtId);
          return spaceContext.cma.createEntry(contentType.getId(), {}).then((entry) => {
            Analytics.track('entry:create', {
              eventOrigin: 'bulk-editor',
              contentType: contentType.data,
              response: entry.data,
            });
            track.addNew();
            return addLinks([linkEntity(entry)]);
          });
        }

        function addExistingEntries() {
          const currentSize = K.getValue(links$).length;
          entitySelector.openFromField(extendedField, currentSize).then((entities) => {
            track.addExisting(entities.length);
            addLinks(entities.map(linkEntity));
          });
        }
      }

      /**
       * Returns a list of content types that the user can add to this field.
       *
       * This takes into account the content types users can create entries for and
       * the content type validation on the field.
       */
      function getAllowedCTs(field) {
        const itemValidations = _.get(field, ['items', 'validations']);

        const contentTypeValidation = _.find(
          itemValidations,
          (validation) => !!validation.linkContentType
        );

        const validCtIds = contentTypeValidation
          ? contentTypeValidation.linkContentType
          : getAllContentTypeIds();

        const validCTs = _.uniq(validCtIds).map((ctId) => spaceContext.publishedCTs.get(ctId));

        return _.filter(
          validCTs,
          (ct) => ct && accessChecker.canPerformActionOnEntryOfType('create', ct.getId())
        ).map((ct) => ct.data);
      }

      function getAllContentTypeIds() {
        return spaceContext.publishedCTs.getAllBare().map((ct) => ct.sys.id);
      }

      function linkEntity(entity) {
        return {
          sys: {
            id: entity.sys.id,
            linkType: entity.sys.type,
            type: 'Link',
          },
        };
      }
    },
  ]);
}
