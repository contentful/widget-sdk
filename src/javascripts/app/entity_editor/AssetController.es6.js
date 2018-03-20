import $controller from '$controller';
import closeState from 'navigation/closeState';

import * as K from 'utils/kefir';
import {truncate, fileNameToTitle} from 'stringUtils';
import {get, find, constant} from 'lodash';

import spaceContext from 'spaceContext';
import notification from 'notification';
import localeStore from 'TheLocaleStore';
import contextHistory from 'navigation/Breadcrumbs/History';

import * as crumbFactory from 'navigation/Breadcrumbs/Factory';

import * as Validator from './Validator';
import * as Focus from './Focus';
import initDocErrorHandler from './DocumentErrorHandler';
import {makeNotify} from './Notifications';
import installTracking from './Tracking';
import renderStatusNotification from './StatusNotification';

export default function create ($scope, editorData) {
  $scope.editorData = editorData;

  // add list view as parent if it's a deep link to the media/asset
  if (contextHistory.isEmpty()) {
    contextHistory.add(crumbFactory.AssetList());
  }

  // add current state
  contextHistory.add(crumbFactory.Asset(editorData.entity.getSys(), $scope.context));

  const editorContext = $scope.editorContext = {};

  const entityInfo = editorContext.entityInfo = editorData.entityInfo;

  const notify = makeNotify('Asset', function () {
    return '“' + $scope.title + '”';
  });

  $scope.entityInfo = entityInfo;

  $scope.locales = $controller('entityEditor/LocalesController');

  // TODO rename the scope property
  $scope.otDoc = editorData.openDoc(K.scopeLifeline($scope));
  initDocErrorHandler($scope, $scope.otDoc.state.error$);

  K.onValueScope($scope, $scope.otDoc.status$, (status) => {
    $scope.entityStatusComponent = renderStatusNotification(status, 'asset');
  });

  installTracking(entityInfo, $scope.otDoc, K.scopeLifeline($scope));

  editorContext.validator = Validator.createForAsset(
    $scope.otDoc,
    localeStore.getPrivateLocales()
  );

  editorContext.focus = Focus.create();

  editorContext.closeSlideinEditor = function () {
    closeState();
  };

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: editorData.entity,
    notify: notify,
    validator: editorContext.validator,
    otDoc: $scope.otDoc
  });


  K.onValueScope($scope, $scope.otDoc.valuePropertyAt([]), function (data) {
    const title = spaceContext.assetTitle({
      getContentTypeId: constant(),
      data: data
    });
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, function (isDirty) {
    $scope.context.dirty = isDirty;
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    controls: editorData.fieldControls.form
  });

  // File uploads
  $scope.$on('fileUploaded', function (_event, file, locale) {
    setTitleOnDoc(file, locale.internal_code);
    editorData.entity.process($scope.otDoc.getVersion(), locale.internal_code)
    .catch(function (err) {
      // this event is handled in a child directive (cfFileEditor)
      // we need to broadcast it down the element tree
      $scope.$broadcast('fileProcessingFailed');

      const errors = get(err, ['body', 'details', 'errors'], []);
      const invalidContentTypeErr = find(errors, {name: 'invalidContentType'});

      if (invalidContentTypeErr) {
        notification.error(invalidContentTypeErr.details);
      } else {
        notification.error('There has been a problem processing the Asset.');
      }
    });
  });

  function setTitleOnDoc (file, localeCode) {
    const path = ['fields', 'title', localeCode];
    const fileName = fileNameToTitle(file.fileName);
    if (!$scope.otDoc.getValueAt(path)) {
      $scope.otDoc.setValueAt(path, fileName);
    }
  }
}
