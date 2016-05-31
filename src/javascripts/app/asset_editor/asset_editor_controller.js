'use strict';

angular.module('contentful')
.controller('AssetEditorController', ['$scope', '$injector', function AssetEditorController ($scope, $injector) {
  var $controller = $injector.get('$controller');
  var logger = $injector.get('logger');
  var notification = $injector.get('notification');
  var stringUtils = $injector.get('stringUtils');
  var notifier = $injector.get('entryEditor/notifications');
  var spaceContext = $injector.get('spaceContext');
  var truncate = $injector.get('stringUtils').truncate;
  var accessChecker = $injector.get('accessChecker');

  var notify = notifier(function () {
    return '“' + $scope.title + '”';
  });

  $scope.locales = $controller('entityEditor/LocalesController');

  $scope.state = $controller('entityEditor/StateController', {
    $scope: $scope,
    entity: $scope.asset,
    notify: notify,
    handlePublishError: handlePublishError
  });

  $scope.notifications = $controller('entityEditor/StatusNotificationsController', {
    $scope: $scope,
    entityLabel: 'asset',
    isReadOnly: isReadOnly
  });

  $controller('entityEditor/FieldAccessController', {$scope: $scope});

  $scope.$watch(function () {
    return spaceContext.assetTitle($scope.asset);
  }, function (title) {
    $scope.context.title = title;
    $scope.title = truncate(title, 50);
  });

  $scope.$watch(function (scope) {
    if (scope.otDoc.doc && scope.asset) {
      if (angular.isDefined(scope.asset.getPublishedVersion())) {
        return scope.otDoc.doc.version > scope.asset.getPublishedVersion() + 1;
      } else {
        return 'draft';
      }
    } else {
      return undefined;
    }
  }, function (modified) {
    if (modified !== undefined) $scope.context.dirty = modified;
  });


  // OT Stuff
  $scope.$watch(function assetEditorDisabledWatcher (scope) {
    return scope.asset.isArchived() || isReadOnly();
  }, function assetEditorDisabledHandler (disabled) {
    if (disabled) {
      $scope.otDoc.close();
    } else {
      $scope.otDoc.open();
    }
  });

  // Validations
  $scope.$watch('asset.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });
  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.asset.data.fields)) scope.validate();
    firstValidate();
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
