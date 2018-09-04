import $controller from '$controller';

import * as K from 'utils/kefir.es6';
import { truncate } from 'stringUtils';

import spaceContext from 'spaceContext';
import localeStore from 'TheLocaleStore';
import contextHistory from 'navigation/Breadcrumbs/History.es6';

import * as crumbFactory from 'navigation/Breadcrumbs/Factory.es6';

import * as Validator from './Validator.es6';
import * as Focus from './Focus.es6';
import initDocErrorHandler from './DocumentErrorHandler.es6';
import { makeNotify } from './Notifications.es6';
import installTracking from './Tracking.es6';

import { loadAsset } from 'app/entity_editor/DataLoader.es6';
import { onFeatureFlag } from 'utils/LaunchDarkly';

const SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG = 'feature-at-05-2018-sliding-entry-editor-multi-level';

export default async function create($scope, assetId) {
  $scope.context = {};
  let editorData;
  try {
    editorData = await loadAsset(spaceContext, assetId);
  } catch (error) {
    $scope.context.loadingError = error;
    return;
  }
  $scope.context.ready = true;
  $scope.editorData = editorData;

  // add list view as parent if it's a deep link to the media/asset
  if (contextHistory.isEmpty()) {
    contextHistory.add(crumbFactory.AssetList());
  }

  // add current state
  contextHistory.add(crumbFactory.Asset(editorData.entity.getSys(), $scope.context));

  const editorContext = ($scope.editorContext = {});

  const entityInfo = (editorContext.entityInfo = editorData.entityInfo);

  const notify = makeNotify('Asset', () => '“' + $scope.title + '”');

  $scope.entityInfo = entityInfo;

  $scope.locales = $controller('entityEditor/LocalesController');

  // TODO rename the scope property
  $scope.otDoc = editorData.openDoc(K.scopeLifeline($scope));
  initDocErrorHandler($scope, $scope.otDoc.state.error$);

  K.onValueScope($scope, $scope.otDoc.status$, status => {
    $scope.props = { status, entityLabel: 'asset' };
  });

  installTracking(entityInfo, $scope.otDoc, K.scopeLifeline($scope));

  editorContext.validator = Validator.createForAsset($scope.otDoc, localeStore.getPrivateLocales());

  editorContext.focus = Focus.create();

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: editorData.entity,
    notify: notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc
  });

  K.onValueScope($scope, $scope.otDoc.valuePropertyAt([]), data => {
    const title = spaceContext.assetTitle({
      getContentTypeId: () => {},
      data: data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, isDirty => {
    $scope.context.dirty = isDirty;
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    controls: editorData.fieldControls.form
  });

  onFeatureFlag($scope, SLIDEIN_ENTRY_EDITOR_FEATURE_FLAG, flagValue => {
    $scope.shouldShowBreadcrumbs = flagValue !== 2;
  });
}
