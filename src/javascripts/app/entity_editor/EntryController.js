import * as K from 'core/utils/kefir';
import { keys } from 'lodash';
import mitt from 'mitt';
import installTracking, { trackEntryView } from './Tracking';
import { bootstrapEntryEditorLoadEvents } from 'app/entity_editor/LoadEventTracker';
import initLocaleData from 'app/entity_editor/setLocaleData';

import { getModule } from 'core/NgRegistry';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge';
import { getEditorState } from './editorState';
import { proxify } from 'core/services/proxy';

/**
 * @ngdoc type
 * @name EntryEditorController
 * @description
 * Main controller for the entry editor that is exposed as
 * `editorContext`.
 *
 * The scope properties this controller depends on are provided by the
 * entry state controller.
 *
 * This controller can be mocked with the `mocks/entryEditor/Context`
 * service.
 *
 * TODO this controller shares a lot of code with the
 * AssetEditorController.
 *
 * TODO instead of exposing the sub-controllers on the scope we should
 * expose them on this controller.
 *
 * @param {Object} $scope
 * @param {Object} editorData
 * @param {boolean} preferences.hasInitialFocus
 * @param {boolean} preferences.showDisabledFields
 * @scope.requires {Data.FieldControl[]} formControls
 *   Passed to FormWidgetsController to render field controls
 */
export default async function create($scope, editorData, preferences, trackLoadEvent) {
  const spaceContext = getModule('spaceContext');

  $scope.context = {};
  $scope.context.ready = true;
  $scope.editorData = editorData;
  $scope.loadEvents = K.createStreamBus($scope);
  const { entityInfo } = editorData;
  $scope.entityInfo = entityInfo;

  $scope.preferences = proxify(preferences);
  $scope.localeData = proxify({});

  $scope.getOtDoc = () => $scope.otDoc;
  $scope.getEditorData = () => editorData;
  $scope.getSpace = () => spaceContext.getSpace();

  const scopeLifeline = K.scopeLifeline($scope);
  const currentSlideLevel = Object.keys($scope.slideStates || {}).length;
  const editorState = getEditorState({
    editorData,
    onStateUpdate: (state) => {
      $scope.state = state;
      $scope.$applyAsync();
    },
    onTitleUpdate: (title) => {
      $scope.title = title;
      $scope.$applyAsync();
    },
    trackView: (args) =>
      trackEntryView({
        ...args,
        editorType: currentSlideLevel > 1 ? 'slide_in_editor' : 'entry_editor',
        currentSlideLevel,
      }),
    lifeline: scopeLifeline,
    hasInitialFocus: preferences.hasInitialFocus,
    publishedCTs: spaceContext.publishedCTs,
    spaceId: spaceContext.getId(),
    environmentId: spaceContext.getEnvironmentId(),
  });

  const { doc, editorContext } = editorState;

  $scope.editorContext = editorContext;
  $scope.otDoc = doc;

  /**
   * @type {EntityDocument}
   */
  bootstrapEntryEditorLoadEvents($scope.otDoc, $scope.loadEvents, editorData, trackLoadEvent);

  installTracking(entityInfo, doc, scopeLifeline);

  K.onValue(doc.state.isDirty$, (isDirty) => {
    $scope.context.dirty = isDirty;
  });

  $scope.emitter = mitt();

  $scope.entrySidebarProps = createEntrySidebarProps({
    entityInfo: $scope.entityInfo,
    localeData: $scope.localeData,
    editorData: $scope.editorData,
    editorContext: $scope.editorContext,
    otDoc: $scope.otDoc,
    state: $scope.state,
    fieldController: $scope.fieldController,
    preferences: $scope.preferences,
    emitter: $scope.emitter,
  });

  initLocaleData({
    initialValues: $scope,
    entityLabel: 'entry',
    shouldHideLocaleErrors: onlyFocusedLocaleHasErrors,
    emitter: $scope.emitter,
    onUpdate: () => {
      $scope.$applyAsync();
    },
  });

  function onlyFocusedLocaleHasErrors() {
    const { errors, focusedLocale } = $scope.localeData;
    const localeCodes = keys(errors);
    return localeCodes.length === 1 && localeCodes[0] === focusedLocale.internal_code;
  }
}
