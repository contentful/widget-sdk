import mitt from 'mitt';
import * as K from 'core/utils/kefir';
import { truncate } from 'utils/StringUtils';
import { user$ } from 'services/TokenStore';
import * as Validator from './Validator';
import * as Focus from './Focus';
import initDocErrorHandler from './DocumentErrorHandler';
import { makeNotify } from './Notifications';
import installTracking from './Tracking';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge';
import { keys } from 'lodash';
import setLocaleData from 'app/entity_editor/setLocaleData';
import TheLocaleStore from 'services/localeStore';
import setupNoShareJsCmaFakeRequestsExperiment from './NoShareJsCmaFakeRequestsExperiment';
import initSidebarTogglesProps from 'app/entity_editor/entityEditorSidebarToggles';
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
  const $controller = getModule('$controller');
  const spaceContext = getModule('spaceContext');
  const $rootScope = getModule('$rootScope');

  $scope.sidebarToggleProps = initSidebarTogglesProps($rootScope, $scope);

  $scope.context = {};
  $scope.editorData = editorData;

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Asset', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  // TODO rename the scope property
  $scope.otDoc = editorData.openDoc(K.scopeLifeline($scope));
  initDocErrorHandler($scope, $scope.otDoc.state.error$);

  installTracking(entityInfo, $scope.otDoc, K.scopeLifeline($scope));

  editorContext.validator = Validator.createForAsset(
    $scope.otDoc,
    TheLocaleStore.getPrivateLocales()
  );

  editorContext.focus = Focus.create();

  initStateController({
    entity: editorData.entity,
    notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc,
    bulkEditorContext: $scope.bulkEditorContext,
    entityInfo: $scope.entityInfo,
    editorData: $scope.editorData,
    spaceContext,
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

  $scope.user = K.getValue(user$);

  editorContext.hasInitialFocus = preferences.hasInitialFocus;

  $scope.localeData = {};

  $scope.emitter = mitt();

  $scope.entrySidebarProps = createEntrySidebarProps({
    $scope,
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

  setLocaleData($scope, {
    entityLabel: 'asset',
    shouldHideLocaleErrors: defaultLocaleIsFocused,
    emitter: $scope.emitter,
  });

  $controller('FormWidgetsController', {
    $scope,
    controls: editorData.fieldControls.form,
  });

  setupNoShareJsCmaFakeRequestsExperiment({ $scope, spaceContext, entityInfo });

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
