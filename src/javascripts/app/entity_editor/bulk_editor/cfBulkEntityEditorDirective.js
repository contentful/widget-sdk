import { registerDirective, registerController, getModule } from 'core/NgRegistry';
import _ from 'lodash';
import * as K from 'utils/kefir';
import { caseof } from 'sum-types';
import * as Navigator from 'states/Navigator';
import * as SlideInNavigator from 'navigation/SlideInNavigator';
import { makeNotify } from 'app/entity_editor/Notifications';
import { truncate } from 'utils/StringUtils';
import * as Focus from 'app/entity_editor/Focus';
import * as logger from 'services/logger';
import localeStore from 'services/localeStore';
import { trackEntryView } from 'app/entity_editor/Tracking';
import { localFieldChanges, valuePropertyAt } from 'app/entity_editor/Document';

import setupNoShareJsCmaFakeRequestsExperiment from 'app/entity_editor/NoShareJsCmaFakeRequestsExperiment';
import initDocErrorHandler from 'app/entity_editor/DocumentErrorHandler';
import * as Validator from 'app/entity_editor/Validator';
import { buildFieldsApi } from 'app/entity_editor/dataFields';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import createExtensionBridge from 'widgets/bridges/createExtensionBridge';
import * as WidgetLocations from 'widgets/WidgetLocations';

import bulkEntityEditorTemplate from './bulk_entity_editor.html';

export default function register() {
  /**
   * @ngdoc directive
   * @name cfBulkEntityEditor
   *
   * @param {object} entityContext
   *   Contains information about the entity. Passed by cfBulkEditor
   *   directive.
   * @param {string} entityContext.id
   *   ID of the entry that we want to edit.
   * @param {string} entityContext.key
   *   Unique key to reference the entity in the list of entities. Used
   *   to distinguish between duplicate entities.
   * @param {function} entityContext.remove
   *   Removes this entity from the link list.
   *
   * @param {object} bulkEditorContext
   *   Contains information about the editing context that is shared
   *   among entities. Passed by cfBulkEditor directive.
   * @param {API.User} bulkEditorContext.user
   * @param {object} bulkEditorContext.editorSettings
   *   Editor presentation settings. Currently only contains the
   *   'disabled' property. Is inherited from the parent entry editor’s
   *   '$scope.preferences'.
   * @param {Property<string>} bulkEditorContext.scrollTarget$
   *   The key for the entity we want to scroll to.
   * @param {object} bulkEditorContext.track
   *   The tracking object created by the bulk editor tracking service.
   *   Contains methods that can be called to track actions.
   */
  registerDirective('cfBulkEntityEditor', [
    '$q',
    '$controller',
    '$timeout',
    'spaceContext',
    ($q, $controller, $timeout, spaceContext) => {
      return {
        restrict: 'E',
        scope: {
          entityContext: '<',
          bulkEditorContext: '<',
          localeData: '<',
        },
        template: bulkEntityEditorTemplate,
        link: function ($scope, $el) {
          $scope.$el = $el;
          $scope.el = $el.get(0);
        },
        controller: [
          '$scope',
          ($scope) => {
            const entityContext = $scope.entityContext;
            const bulkEditorContext = $scope.bulkEditorContext;

            // TODO required by entityEditor/Document. Should not be on scope
            $scope.user = bulkEditorContext.user;

            // TODO required by FormWidgetsController. Should not be on scope
            $scope.preferences = bulkEditorContext.editorSettings;

            const data = ($scope.data = {
              expanded: true,
              stateRef: Navigator.makeEntityRef({
                sys: {
                  id: entityContext.id,
                  type: 'Entry',
                  environment: {
                    sys: {
                      id: spaceContext.getEnvironmentId(),
                      isMasterEnvironment: spaceContext.isMasterEnvironment(),
                    },
                  },
                  space: {
                    sys: { id: spaceContext.getId() },
                  },
                },
              }),
            });

            K.onValueScope($scope, bulkEditorContext.scrollTarget$, (key) => {
              if (key === entityContext.key) {
                $timeout(() => {
                  $scope.$el.find('input').eq(0).focus();
                  $scope.el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                });
              }
            });

            const editorDataPromise$ = K.promiseProperty(
              bulkEditorContext.loadEditorData(entityContext.id).then((editorData) => {
                const doc = editorData.openDoc(K.scopeLifeline($scope));
                // We wait for the document to be opened until we setup the
                // editor
                return doc.state.loaded$
                  .toPromise($q)
                  .then(() => _.assign({ doc: doc }, editorData));
              })
            );

            // Property<boolean>
            // True if the entry data is still loading. False when the data was loaded
            // or the loading failed.
            const loadingEditorData$ = editorDataPromise$.map((p) =>
              caseof(p, [
                [K.PromiseStatus.Pending, _.constant(true)],
                [null, _.constant(false)],
              ])
            );

            // Stream<void>
            // Emits exactly one event when the entry data has been loaded or the
            // loading has failed
            const loaded$ = loadingEditorData$.filter((loading) => loading === false);

            K.onValueScope($scope, loaded$, bulkEditorContext.initializedEditor);

            K.onValueScope($scope, loadingEditorData$, (loading) => {
              $scope.loading = loading;
            });

            // Property<object?>
            // Holds the editor data if it has been loaded successfully. Holds 'null'
            // otherwise
            const editorData$ = editorDataPromise$.map((p) =>
              caseof(p, [
                [K.PromiseStatus.Resolved, (p) => p.value],
                [null, _.constant(null)],
              ])
            );

            K.onValueScope($scope, editorData$, (editorData) => {
              if (editorData) {
                setupEditor(editorData);

                try {
                  trackEntryView({
                    editorData: $scope.editorData,
                    entityInfo: $scope.entityInfo,
                    currentSlideLevel: 0,
                    locale: localeStore.getDefaultLocale().internal_code,
                    editorType: 'bulk_editor',
                  });
                } catch (error) {
                  logger.logError(error);
                }
              }
            });

            function setupEditor(editorData) {
              const $rootScope = getModule('$rootScope');

              $scope.editorData = editorData;
              $scope.otDoc = editorData.doc;
              $scope.customExtensionProps = {
                extension: editorData.editorExtension,
                bridge: createExtensionBridge(
                  {
                    $rootScope,
                    $scope,
                    spaceContext,
                    Navigator,
                    SlideInNavigator,
                    $controller,
                  },
                  WidgetLocations.LOCATION_ENTRY_EDITOR
                ),
              };
              $controller('InlineEditingController/editor', { $scope });
              data.hasEditor = true;
            }

            const trackAction = $scope.bulkEditorContext.track.actions(entityContext.id);

            $scope.openInEntryEditor = function () {
              trackAction.openInEntryEditor();
            };

            $scope.unlink = function () {
              trackAction.unlink();
              entityContext.remove();
            };

            $scope.actions = {
              toggleExpansion: function () {
                data.expanded = !data.expanded;
                trackAction.setExpansion(data.expanded);
              },
            };
          },
        ],
      };
    },
  ]);

  // TODO Consolidate this! same as entry editor minus some stuff
  registerController('InlineEditingController/editor', [
    '$scope',
    '$controller',
    'spaceContext',
    function InlineEditingControllerEditor($scope, $controller, spaceContext) {
      const editorData = $scope.editorData;
      const entityInfo = (this.entityInfo = editorData.entityInfo);
      const notify = makeNotify('Entry', () => '“' + $scope.title + '”');

      $scope.editorContext = this;
      $scope.entityInfo = entityInfo;

      initDocErrorHandler($scope, $scope.otDoc.state.error$);

      this.validator = Validator.createForEntry(
        entityInfo.contentType,
        $scope.otDoc,
        spaceContext.publishedCTs,
        localeStore.getPrivateLocales()
      );

      $scope.state = $controller('entityEditor/StateController', {
        $scope: $scope,
        entity: editorData.entity,
        notify: notify,
        validator: this.validator,
        otDoc: $scope.otDoc,
      });

      const { track } = $scope.bulkEditorContext;

      K.onValueScope($scope, $scope.otDoc.resourceState.stateChange$, (data) => {
        track.changeStatus($scope.entityInfo.id, data.to);
      });

      K.onValueScope($scope, localFieldChanges($scope.otDoc), () => {
        track.edited(entityInfo.id);
      });

      this.focus = Focus.create();

      K.onValueScope($scope, $scope.otDoc.state.isSaving$, (isSaving) => {
        $scope.data.isSaving = isSaving;
      });

      K.onValueScope($scope, valuePropertyAt($scope.otDoc, []), (data) => {
        const title = EntityFieldValueSpaceContext.entryTitle({
          getContentTypeId: _.constant($scope.entityInfo.contentTypeId),
          data: data,
        });
        $scope.title = truncate(title, 50);
      });

      setupNoShareJsCmaFakeRequestsExperiment({ $scope, spaceContext, entityInfo });

      // Building the form
      $controller('FormWidgetsController', {
        $scope,
        controls: editorData.fieldControls.form,
      });

      /**
       * Build the `entry.fields` api of the widget-sdk at one
       * place and put it on $scope so that we don't rebuild it
       * for every widget. Instead, we share this version in every
       * cfWidgetApi instance.
       */
      const fields = entityInfo.contentType.fields;
      $scope.fields = buildFieldsApi(fields, $scope.otDoc);
    },
  ]);
}
