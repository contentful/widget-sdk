import mitt from 'mitt';
import * as K from 'core/utils/kefir';
import installTracking from './Tracking';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge';
import { keys } from 'lodash';
import initLocaleData from 'app/entity_editor/setLocaleData';
import { getModule } from 'core/NgRegistry';
import { proxify } from 'core/services/proxy';
import { getEditorState } from './editorState';

/**
 * @param {Object} $scope
 * @param {Object} editorData
 * @returns {Promise<void>}
 */
export default async function create($scope, editorData, preferences) {
  const spaceContext = getModule('spaceContext');

  $scope.context = {};
  $scope.editorData = editorData;
  const { entityInfo } = editorData;

  $scope.entityInfo = entityInfo;
  $scope.preferences = proxify(preferences);
  $scope.localeData = proxify({});

  const scopeLifeline = K.scopeLifeline($scope);
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
    lifeline: scopeLifeline,
    hasInitialFocus: preferences.hasInitialFocus,
    contentTypes: spaceContext.publishedCTs.getAllBare(),
    spaceId: spaceContext.getId(),
    environmentId: spaceContext.getEnvironmentId(),
  });

  const { doc, editorContext } = editorState;
  // TODO rename the scope property
  $scope.otDoc = doc;
  $scope.editorContext = editorContext;

  installTracking(entityInfo, $scope.otDoc, K.scopeLifeline($scope));

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, (isDirty) => {
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

  $scope.tagProps = {
    // it's not possible to forward otDoc because of angular things,
    getValueAt: (path) => $scope.otDoc.getValueAt(path),
    setValueAt: (path, value) => $scope.otDoc.setValueAt(path, value),
    show: !$scope.otDoc.isOtDocument,
  };

  $scope.getOtDoc = () => $scope.otDoc;
  $scope.getEditorData = () => $scope.editorData;

  initLocaleData({
    initialValues: $scope,
    entityLabel: 'asset',
    shouldHideLocaleErrors: defaultLocaleIsFocused,
    emitter: $scope.emitter,
    onUpdate: () => {
      $scope.$applyAsync();
    },
  });

  function defaultLocaleIsFocused() {
    if (!$scope.localeData.isSingleLocaleModeOn) {
      return false;
    }
    return (
      keys($scope.localeData.errors).length === 1 &&
      $scope.localeData.defaultLocale.internal_code ===
        $scope.localeData.focusedLocale.internal_code
    );
  }
}
