'use strict';

angular.module('contentful')
.controller('AssetEditorController', ['$scope', 'require', function AssetEditorController ($scope, require) {
  var $controller = require('$controller');
  var logger = require('logger');
  var notification = require('notification');
  var stringUtils = require('stringUtils');
  var notifier = require('entryEditor/notifications');
  var spaceContext = require('spaceContext');
  var truncate = require('stringUtils').truncate;
  var accessChecker = require('accessChecker');
  var K = require('utils/kefir');
  var Validator = require('entityEditor/Validator');
  var localeStore = require('TheLocaleStore');
  var createAssetSchema = require('validation').schemas.Asset;
  var errorMessageBuilder = require('errorMessageBuilder');
  var deepFreeze = require('utils/DeepFreeze').deepFreeze;

  var notify = notifier(function () {
    return '“' + $scope.title + '”';
  });

  $scope.entityInfo = deepFreeze({
    id: $scope.entity.data.sys.id,
    type: $scope.entity.data.sys.type,
    // If necessary, we can set this to the value exported by the
    // 'assetContentType' module.
    contentType: null
  });

  $scope.locales = $controller('entityEditor/LocalesController');

  // TODO rename the scope property
  $scope.otDoc = $controller('entityEditor/Document', {
    $scope: $scope,
    entity: $scope.entity,
    contentType: null
  });

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: $scope.asset,
    notify: notify,
    handlePublishError: handlePublishError,
    otDoc: $scope.otDoc
  });

  var schema = createAssetSchema(localeStore.getPrivateLocales());
  var buildMessage = errorMessageBuilder.forAsset;
  var validator = Validator.create(buildMessage, schema, function () {
    return $scope.otDoc.getValueAt([]);
  });
  validator.run();
  this.validator = validator;


  $scope.$watch(function () {
    return spaceContext.assetTitle($scope.asset);
  }, function (title) {
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty$, function (isDirty) {
    $scope.context.dirty = isDirty;
  });

  // TODO move this into sidebar controller
  K.onValueScope($scope, $scope.otDoc.state.isSaving$, function (isSaving) {
    $scope.documentIsSaving = isSaving;
  });

  // OT Stuff
  $scope.$watch(function assetEditorDisabledWatcher (scope) {
    return scope.asset.isArchived() || isReadOnly();
  }, $scope.otDoc.setReadOnly);

  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    controls: $scope.formControls
  });

  // File uploads
  $scope.$on('fileUploaded', function (_event, file, locale) {
    setTitleOnDoc(file, locale.internal_code);
    $scope.asset.process($scope.otDoc.doc.version, locale.internal_code)
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

  function handlePublishError (error) {
    validator.setApiResponseErrors(error);

    var errorId = dotty.get(error, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      notify.publishValidationFail();
    } else if (errorId === 'VersionMismatch') {
      notify.publishFail('Can only publish most recent version');
    } else {
      notify.publishServerFail(error);
    }
  }

  function isReadOnly () {
    return !accessChecker.canUpdateAsset($scope.asset);
  }
}]);
