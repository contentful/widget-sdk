import mitt from 'mitt';
import * as K from 'core/utils/kefir';
import { truncate } from 'utils/StringUtils';
import * as Validator from './Validator';
import * as Focus from './Focus';
import initDocErrorHandler from './DocumentErrorHandler';
import installTracking from './Tracking';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge';
import { keys } from 'lodash';
import initLocaleData from 'app/entity_editor/setLocaleData';
import TheLocaleStore from 'services/localeStore';
import { getModule } from 'core/NgRegistry';
import * as EntityFieldValueSpaceContext from 'classes/EntityFieldValueSpaceContext';
import { valuePropertyAt } from './Document';
import { initStateController } from './stateController';

/**
 * @param {Object} $scope
 * @param {Object} editorData
 * @returns {Promise<void>}
 */
export default async function create($scope, editorData, preferences) {
  const spaceContext = getModule('spaceContext');

  $scope.context = {};
  $scope.editorData = editorData;

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  $scope.entityInfo = entityInfo;

  // TODO rename the scope property
  const doc = editorData.openDoc(K.scopeLifeline($scope));
  $scope.otDoc = doc;
  initDocErrorHandler($scope, $scope.otDoc.state.error$);

  installTracking(entityInfo, $scope.otDoc, K.scopeLifeline($scope));

  editorContext.validator = Validator.createForAsset(
    $scope.otDoc,
    TheLocaleStore.getPrivateLocales()
  );

  editorContext.focus = Focus.create();

  initStateController({
    entity: editorData.entity,
    getTitle: () => $scope.title,
    validator: editorContext.validator,
    doc,
    entityInfo,
    editorData,
    spaceId: spaceContext.getId(),
    environmentId: spaceContext.getEnvironmentId(),
    publishedCTs: spaceContext.publishedCTs,
    onUpdate: (state) => {
      $scope.state = state;
      $scope.$applyAsync();
    },
  });

  K.onValueScope($scope, valuePropertyAt($scope.otDoc, []), (data) => {
    const title = EntityFieldValueSpaceContext.assetTitle({
      getContentTypeId: () => {},
      data,
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
    editorContext.validator.run();
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, (isDirty) => {
    $scope.context.dirty = isDirty;
  });

  editorContext.hasInitialFocus = preferences.hasInitialFocus;

  $scope.localeData = {};

  $scope.emitter = mitt();

  $scope.entrySidebarProps = createEntrySidebarProps({
    entityInfo: $scope.entityInfo,
    localeData: $scope.localeData,
    editorData: $scope.editorData,
    editorContext: $scope.editorContext,
    otDoc: $scope.otDoc,
    state: $scope.state,
    watch: (watchFn, cb) => $scope.$watch(watchFn, cb),
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
