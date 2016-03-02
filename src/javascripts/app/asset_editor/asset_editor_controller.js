'use strict';

angular.module('contentful')
.controller('AssetEditorController', ['$scope', '$injector', function AssetEditorController($scope, $injector) {
  var $controller       = $injector.get('$controller');
  var ShareJS           = $injector.get('ShareJS');
  var TheLocaleStore    = $injector.get('TheLocaleStore');
  var logger            = $injector.get('logger');
  var notification      = $injector.get('notification');
  var stringUtils       = $injector.get('stringUtils');
  var notifier          = $injector.get('entryEditor/notifications');
  var spaceContext      = $injector.get('spaceContext');
  var truncate          = $injector.get('stringUtils').truncate;
  var accessChecker     = $injector.get('accessChecker');

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
      if (angular.isDefined(scope.asset.getPublishedVersion()))
        return scope.otDoc.doc.version > scope.asset.getPublishedVersion() + 1;
      else
        return 'draft';
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.context.dirty = modified;
  });


  // OT Stuff
  $scope.$watch(function assetEditorDisabledWatcher(scope) {
    return scope.asset.isArchived() || isReadOnly();
  }, function assetEditorDisabledHandler(disabled) {
    $scope.otDoc.state.disabled = disabled;
  });

  // Validations
  $scope.errorPaths = {};
  $scope.$watch('asset.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
  });
  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.asset.data.fields)) scope.validate();
    firstValidate();
  });
  $scope.$watch('validationResult.errors', function (errors) {
    $scope.errorPaths = {};
    $scope.hasErrorOnFields = false;

    _.each(errors, function (error) {
      if (!_.isObject(error)) {
        // TODO We have seen errors on bugsnag where path is not an
        // object. This is some temporary logging to gather some data.
        logger.logError('Validation error is not an object', {
          data: {
            validationErrors: errors,
            assetFields: dotty.get($scope.asset, 'data.fields')
          }
        });
      }

      if (error.path[0] !== 'fields') return;
      var field      = error.path[1];
      $scope.errorPaths[field] = $scope.errorPaths[field] || [];

      if (error.path.length == 1 && error.path[0] == 'fields') {
        $scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      } else if (error.path.length == 2) {
        $scope.errorPaths[field].push(TheLocaleStore.getDefaultLocale().internal_code);
      } else {
        var localeCode = error.path[2];
        $scope.errorPaths[field].push(localeCode);
      }
      $scope.errorPaths[field] = _.unique($scope.errorPaths[field]);
    });
  });

  // Building the form
  $controller('FormWidgetsController', {
    $scope: $scope,
    contentTypeId: '__cf_asset',
    controls: $scope.formControls
  });

  // File uploads
  $scope.$on('fileUploaded', function (event, file, locale) {
    setTitleOnDoc(file, locale.internal_code);
    $scope.asset.process($scope.otDoc.doc.version, locale.internal_code)
    .catch(function (err) {
      $scope.$emit('fileProcessingFailed');
      notification.error('There has been a problem processing the Asset.');
      logger.logServerWarn('There has been a problem processing the Asset.', {error: err});
    });
  });
  function setTitleOnDoc(file, localeCode) {
    var doc = $scope.otDoc.doc;
    var otPath = ['fields', 'title', localeCode];
    var fileName = stringUtils.fileNameToTitle(file.fileName);
    if(!ShareJS.peek(doc, otPath)) {
      ShareJS.mkpathAndSetValue(doc, otPath, fileName);
    }
  }
  $scope.$watch('asset.data.fields.file', function (file, old, scope) {
    if (file !== old) scope.validate();
  }, true);

  function handlePublishError (error){
    var errorId = dotty.get(error, 'body.sys.id');
    if (errorId === 'ValidationFailed') {
      $scope.setValidationErrors(dotty.get(error, 'body.details.errors'));
      notify.publishValidationFail();
    } else if (errorId === 'VersionMismatch'){
      notify.publishFail('Can only publish most recent version');
    } else {
      notify.publishServerFail(error);
    }
  }

  function isReadOnly() {
    return !accessChecker.canUpdateAsset($scope.asset);
  }
}]);
