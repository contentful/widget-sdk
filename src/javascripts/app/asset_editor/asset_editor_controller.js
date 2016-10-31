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

  var notify = notifier(function () {
    return '“' + $scope.title + '”';
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

  $scope.notifications = $controller('entityEditor/StatusNotificationsController', {
    $scope: $scope,
    entityLabel: 'asset',
    isReadOnly: isReadOnly
  });

  $scope.$watch(function () {
    return spaceContext.assetTitle($scope.asset);
  }, function (title) {
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  K.onValueScope($scope, $scope.otDoc.state.isDirty, function (isDirty) {
    $scope.context.dirty = isDirty;
  });

  // OT Stuff
  $scope.$watch(function assetEditorDisabledWatcher (scope) {
    return scope.asset.isArchived() || isReadOnly();
  }, $scope.otDoc.setReadOnly);

  // Validations
  $scope.$watch('asset.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });

  // We cannot call the method immediately since the directive is only
  // added to the scope afterwards
  $scope.$applyAsync(function () {
    if (!_.isEmpty($scope.asset.data.fields)) $scope.validate();
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    contentTypeId: '__cf_asset',
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
  $scope.$watch('asset.data.fields.file', function (file, old, scope) {
    if (file !== old) scope.validate();
  }, true);

  function handlePublishError (error) {
    var errorId = dotty.get(error, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      $scope.validator.setErrors(dotty.get(error, 'body.details.errors'));
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
