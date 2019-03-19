import * as K from 'utils/kefir.es6';
import { truncate } from 'utils/StringUtils.es6';
import { user$ } from 'services/TokenStore.es6';
import * as Validator from './Validator.es6';
import * as Focus from './Focus.es6';
import initDocErrorHandler from './DocumentErrorHandler.es6';
import { makeNotify } from './Notifications.es6';
import installTracking from './Tracking.es6';
import createEntrySidebarProps from 'app/EntrySidebar/EntitySidebarBridge.es6';
import { keys } from 'lodash';
import setLocaleData from 'app/entity_editor/setLocaleData.es6';

import { getModule } from 'NgRegistry.es6';

const $controller = getModule('$controller');
const spaceContext = getModule('spaceContext');
const TheLocaleStore = getModule('TheLocaleStore');

/**
 * @param {Object} $scope
 * @param {Object} editorData
 * @returns {Promise<void>}
 */
export default async function create($scope, editorData, preferences) {
  $scope.context = {};
  $scope.editorData = editorData;

  const editorContext = ($scope.editorContext = {});
  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Asset', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  // TODO rename the scope property
  $scope.otDoc = editorData.openDoc(K.scopeLifeline($scope));
  initDocErrorHandler($scope, $scope.otDoc.state.error$);

  K.onValueScope($scope, $scope.otDoc.status$, status => {
    $scope.statusNotificationProps = { status, entityLabel: 'asset' };
  });

  installTracking(entityInfo, $scope.otDoc, K.scopeLifeline($scope));

  editorContext.validator = Validator.createForAsset(
    $scope.otDoc,
    TheLocaleStore.getPrivateLocales()
  );

  editorContext.focus = Focus.create();

  $scope.state = $controller('entityEditor/StateController', {
    $scope,
    entity: editorData.entity,
    notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc
  });

  K.onValueScope($scope, $scope.otDoc.valuePropertyAt([]), data => {
    const title = spaceContext.assetTitle({
      getContentTypeId: () => {},
      data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, isDirty => {
    $scope.context.dirty = isDirty;
  });

  $scope.user = K.getValue(user$);

  editorContext.hasInitialFocus = preferences.hasInitialFocus;

  // Building the form
  $controller('FormWidgetsController', {
    $scope,
    controls: editorData.fieldControls.form
  });

  $scope.localeData = {};

  $scope.entrySidebarProps = createEntrySidebarProps({
    $scope
  });

  setLocaleData($scope, 'asset', function defaultLocaleIsFocused() {
    if (!$scope.localeData.isSingleLocaleModeOn) {
      return false;
    }
    return (
      keys($scope.localeData.errors).length === 1 &&
      $scope.localeData.defaultLocale.internal_code ===
        $scope.localeData.focusedLocale.internal_code
    );
  });
}
