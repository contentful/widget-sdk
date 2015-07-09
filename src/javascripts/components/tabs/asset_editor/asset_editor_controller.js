'use strict';

angular.module('contentful').controller('AssetEditorController', ['$scope', '$injector', function AssetEditorController($scope, $injector) {
  var $controller       = $injector.get('$controller');
  var AssetContentType  = $injector.get('AssetContentType');
  var ShareJS           = $injector.get('ShareJS');
  var logger            = $injector.get('logger');
  var notification      = $injector.get('notification');
  var stringUtils       = $injector.get('stringUtils');

  //Initialization
  $scope.entityActionsController = $controller('EntityActionsController', {
    $scope: $scope,
    entityType: 'asset'
  });

  $scope.$watch('spaceContext.assetTitle(asset)', function (title) {
    $scope.context.title = title;
  });

  $scope.$watch(function (scope) {
    if (scope.otDoc && scope.asset) {
      if (angular.isDefined(scope.asset.getPublishedVersion()))
        return scope.otDoc.version > scope.asset.getPublishedVersion() + 1;
      else
        return 'draft';
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.context.dirty = modified;
  });
  $scope.$on('entityDeleted', function (event, asset) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (asset === scope.asset) {
        scope.closeState();
      }
    }
  });

  // OT Stuff
  $scope.$watch(function assetEditorEnabledWatcher(scope) {
    return !scope.asset.isArchived() && scope.permissionController.can('update', scope.asset.data).can;
  }, function assetEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });
  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
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
      if (error.path[0] !== 'fields') return;
      var field      = error.path[1];
      $scope.errorPaths[field] = $scope.errorPaths[field] || [];

      if (error.path.length == 1 && error.path[0] == 'fields') {
        $scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      } else if (error.path.length == 2) {
        $scope.errorPaths[field].push($scope.spaceContext.space.getDefaultLocale().code);
      } else {
        var localeCode = error.path[2];
        $scope.errorPaths[field].push(localeCode);
      }
      $scope.errorPaths[field] = _.unique($scope.errorPaths[field]);
    });
  });

  // Building the form
  $scope.formWidgetsController = $controller('FormWidgetsController', {$scope: $scope});
  $scope.formWidgetsController.contentType = {
    data: AssetContentType,
    getId: _.constant('asset'),
  };

  // File uploads
  $scope.$on('fileUploaded', function (event, file, locale) {
    setTitleOnDoc(file, locale.code);
    $scope.asset.process($scope.otDoc.version, locale.code)
    .catch(function (err) {
      $scope.$emit('fileProcessingFailed');
      notification.error('There has been a problem processing the Asset.');
      logger.logServerWarn('There has been a problem processing the Asset.', err);
    });
  });
  function setTitleOnDoc(file, localeCode) {
    var otPath = ['fields', 'title', localeCode];
    var fileName = stringUtils.fileNameToTitle(file.fileName);
    if(!ShareJS.peek($scope.otDoc, otPath))
      ShareJS.mkpath({
        doc: $scope.otDoc,
        path: otPath,
        value: fileName
      });
  }
  $scope.$watch('asset.data.fields.file', function (file, old, scope) {
    if (file !== old) scope.validate();
  }, true);

  $scope.showLangSwitcher = $scope.spaceContext.space.getPrivateLocales().length > 1;

  $scope.headline = function(){
    return this.spaceContext.assetTitle(this.asset);
  };

}]);
