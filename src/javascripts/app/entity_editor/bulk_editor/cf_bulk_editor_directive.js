angular
  .module('contentful')

  .directive('cfBulkEditor', [
    'require',
    require => {
      const _ = require('lodash');
      const K = require('utils/kefir.es6');
      const accessChecker = require('access_control/AccessChecker');
      const spaceContext = require('spaceContext');
      const entitySelector = require('entitySelector');
      const deepFreeze = require('utils/Freeze.es6').deepFreeze;
      const List = require('utils/List.es6');
      const Tracking = require('app/entity_editor/bulk_editor/Tracking.es6');
      const DataLoader = require('app/entity_editor/DataLoader.es6');
      const Analytics = require('analytics/Analytics.es6');

      return {
        scope: {
          referenceContext: '=',
          renderInline: '='
        },
        restrict: 'E',
        template: JST.bulk_editor(),
        link: link
      };

      function link($scope) {
        // This is passed from the EntryEditorController
        const referenceContext = $scope.referenceContext;

        const templateData = {};
        $scope.data = templateData;

        let nextFocusIndex = referenceContext.focusIndex;
        let initialLoadCount = null;

        const scrollTargetBus = K.createBus($scope);

        let track = Tracking.create(referenceContext.parentId, referenceContext.links$);

        // This ignores tracking when bulk editor is rendered
        // inline.
        if ($scope.renderInline) {
          track = Tracking.createNoop();
        }

        track.open();
        $scope.$on('$destroy', track.close);

        // Property<string>
        // List of IDs for the linked entries
        const ids$ = referenceContext.links$.map(links => {
          links = Array.isArray(links) ? links : [links];
          return links.map(_.property('sys.id')).filter(_.isString);
        });

        // Each of these contexts is passed to a cfBulkEntityEditor
        // directive.
        const entityContexts$ = ids$.map(ids =>
          List.makeKeyed(ids, _.identity).map(item =>
            deepFreeze({
              id: item.value,
              remove: _.partial(removeByKey, item.key),
              key: item.key
            })
          )
        );

        K.onValueScope($scope, entityContexts$, ctxs => {
          $scope.entityContexts = ctxs;
          templateData.linkCount = ctxs.length;
        });

        // The initial count helps us figure out when to remove the global
        // loader.
        K.onValueScope($scope, entityContexts$.take(1), ctxs => {
          initialLoadCount = ctxs.length;
        });

        const loadEditorData = DataLoader.makePrefetchEntryLoader(spaceContext, ids$);
        // Passed to cfBulkEntityEditor directive
        $scope.editorContext = {
          editorSettings: referenceContext.editorSettings,
          scrollTarget$: scrollTargetBus.stream,
          initializedEditor: function() {
            initialLoadCount--;
            if (initialLoadCount < 1) {
              templateData.loaded = true;
              $scope.$applyAsync(forceFocus);
            }
          },
          track: track,
          loadEditorData: loadEditorData
        };

        $scope.actions = makeActions(
          referenceContext.field,
          addLinks,
          referenceContext.links$,
          track,
          $scope.renderInline
        );

        function addLinks(links) {
          nextFocusIndex = -1;
          return Promise.all(links.map(link => referenceContext.add(link)));
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
          if (focusContext && !$scope.renderInline) {
            scrollTargetBus.emit(focusContext.key);
          }
          nextFocusIndex = null;
        }
      }

      /**
       * Returns the actions for creating new entries and adding existing entries.
       */
      function makeActions(field, addLinks, links$, track, isInline) {
        // TODO necessary for entitySelector change it
        const extendedField = _.extend({}, field, {
          itemLinkType: _.get(field, ['items', 'linkType']),
          itemValidations: _.get(field, ['items', 'validations'], [])
        });
        const allowedCTs = getAllowedCTs(extendedField);
        const accessibleCTs = allowedCTs.map(ct => ({
          id: ct.sys.id,
          name: ct.name
        }));

        return {
          allowedCTs: allowedCTs, // For new "Add entry" button behind feature flag.
          accessibleCTs: accessibleCTs, // For legacy "Add entry" button.
          addNewEntry: addNewEntry,
          addExistingEntries: addExistingEntries
        };

        function addNewEntry(ctOrCtId) {
          const contentType = _.isObject(ctOrCtId)
            ? ctOrCtId
            : spaceContext.publishedCTs.get(ctOrCtId);
          return spaceContext.cma.createEntry(contentType.getId(), {}).then(entry => {
            Analytics.track('entry:create', {
              eventOrigin: isInline ? 'inline-reference-editor' : 'bulk-editor',
              contentType: contentType,
              response: { data: entry }
            });
            track.addNew();
            return addLinks([linkEntity(entry)]);
          });
        }

        function addExistingEntries() {
          const currentSize = K.getValue(links$).length;
          entitySelector.openFromField(extendedField, currentSize).then(entities => {
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
          validation => !!validation.linkContentType
        );

        const validCtIds = contentTypeValidation
          ? contentTypeValidation.linkContentType
          : getAllContentTypeIds();

        const validCTs = _.uniq(validCtIds).map(ctId => spaceContext.publishedCTs.get(ctId));

        return _.filter(
          validCTs,
          ct => ct && accessChecker.canPerformActionOnEntryOfType('create', ct.getId())
        ).map(ct => ct.data);
      }

      function getAllContentTypeIds() {
        return spaceContext.publishedCTs.getAllBare().map(ct => ct.sys.id);
      }

      function linkEntity(entity) {
        return {
          sys: {
            id: entity.sys.id,
            linkType: entity.sys.type,
            type: 'Link'
          }
        };
      }
    }
  ]);
