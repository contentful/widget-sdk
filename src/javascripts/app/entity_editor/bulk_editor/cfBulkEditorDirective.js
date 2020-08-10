import { registerDirective } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'core/utils/kefir';
import { deepFreeze } from 'utils/Freeze';
import * as List from 'utils/List';

import * as localeData from 'app/entity_editor/setLocaleData';
import * as DataLoader from 'app/entity_editor/DataLoader';
import * as Tracking from 'app/entity_editor/bulk_editor/Tracking';

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

        $scope.field = referenceContext.field;
        $scope.addLinks = addLinks;
        $scope.getCurrentSize = () => K.getValue(referenceContext.links$).length;
        $scope.track = track;
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
    },
  ]);
}
