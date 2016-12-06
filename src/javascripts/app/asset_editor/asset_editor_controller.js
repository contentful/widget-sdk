'use strict';

angular.module('contentful')
.controller('AssetEditorController', ['$scope', 'require', function AssetEditorController ($scope, require) {
  var $controller = require('$controller');
  var logger = require('logger');
  var notification = require('notification');
  var stringUtils = require('stringUtils');
  var makeNotify = require('app/entity_editor/Notifications').makeNotify;
  var spaceContext = require('spaceContext');
  var truncate = require('stringUtils').truncate;
  var K = require('utils/kefir');
  var Validator = require('entityEditor/Validator');
  var localeStore = require('TheLocaleStore');
  var createAssetSchema = require('validation').schemas.Asset;
  var errorMessageBuilder = require('errorMessageBuilder');
  var deepFreeze = require('utils/DeepFreeze').deepFreeze;
  var Focus = require('app/entity_editor/Focus');

  var editorData = $scope.editorData;

  var notify = makeNotify('Asset', function () {
    return '“' + $scope.title + '”';
  });

  $scope.entityInfo = deepFreeze({
    id: editorData.entity.data.sys.id,
    type: editorData.entity.data.sys.type,
    // If necessary, we can set this to the value exported by the
    // 'assetContentType' module.
    contentType: null
  });

  $scope.locales = $controller('entityEditor/LocalesController');

  // TODO rename the scope property
  $scope.otDoc = spaceContext.docPool.get(
    editorData.entity,
    null,
    $scope.user,
    K.scopeLifeline($scope)
  );

  var schema = createAssetSchema(localeStore.getPrivateLocales());
  var buildMessage = errorMessageBuilder.forAsset;
  var validator = Validator.create(buildMessage, schema, function () {
    return $scope.otDoc.getValueAt([]);
  });
  validator.run();
  this.validator = validator;

  this.focus = Focus.create();

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: editorData.entity,
    notify: notify,
    validator: validator,
    otDoc: $scope.otDoc
  });


  K.onValueScope($scope, $scope.otDoc.valuePropertyAt([]), function (data) {
    var title = spaceContext.assetTitle({
      getContentTypeId: _.constant(),
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
      $scope.$emit('fileProcessingFailed');
      notification.error('There has been a problem processing the Asset.');
      logger.logServerWarn('There has been a problem processing the Asset.', {error: err});
    });
  });

  function setTitleOnDoc (file, localeCode) {
    var path = ['fields', 'title', localeCode];
    var fileName = stringUtils.fileNameToTitle(file.fileName);
    if (!$scope.otDoc.getValueAt(path)) {
      $scope.otDoc.setValueAt(path, fileName);
    }
  }
}]);
