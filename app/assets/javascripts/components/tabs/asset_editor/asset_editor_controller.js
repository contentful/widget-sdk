'use strict';

angular.module('contentful').controller('AssetEditorCtrl', ['$scope', 'validation', 'AssetContentType', 'notification', 'addCanMethods', 'ShareJS', 'stringUtils', function AssetEditorCtrl($scope, validation, AssetContentType, notification, addCanMethods, ShareJS, stringUtils) {
  $scope.$watch('tab.params.asset', 'asset=tab.params.asset');
  $scope.$watch(function assetEditorEnabledWatcher(scope) {
    return !scope.asset.isArchived() && scope.can('update', scope.asset.data);
  }, function assetEditorEnabledHandler(enabled, old, scope) {
    scope.otDisabled = !enabled;
  });

  $scope.tab.closingMessage = 'You have unpublished changes.';
  $scope.tab.closingMessageDisplayType = 'tooltip';

  $scope.$watch('spaceContext.assetTitle(asset)', function(title, old, scope) {
    scope.tab.title = title;
  });

  $scope.$on('entityDeleted', function (event, asset) {
    if (event.currentScope !== event.targetScope) {
      var scope = event.currentScope;
      if (asset === scope.asset) {
        scope.tab.close();
      }
    }
  });

  $scope.$on('otRemoteOp', function (event) {
    event.currentScope.otUpdateEntity();
  });

  addCanMethods($scope, 'asset');

  $scope.assetSchema = validation.schemas.Asset($scope.spaceContext.space.getPublishLocales());

  // TODO This can probably be removed since we always keep the entity in sync
  $scope.publishedAt = function(){
    if (!$scope.otDoc) return;
    var val = $scope.otDoc.getAt(['sys', 'publishedAt']);
    if (val) {
      return new Date(val);
    } else {
      return undefined;
    }
  };

  $scope.$watch('asset.getPublishedVersion()', function (publishedVersion, oldVersion, scope) {
    if (publishedVersion > oldVersion) scope.validate();
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
    if (modified !== undefined) scope.tab.dirty = modified;
  });

  $scope.$watch(function (scope) {
    return _.pluck(scope.spaceContext.activeLocales, 'code');
  }, updateFields, true);
  $scope.$watch('spaceContext.space.getDefaultLocale()', updateFields);
  $scope.$watch(function () { return errorPaths; }, updateFields);
  var errorPaths = {};

  function updateFields(n, o ,scope) {
    scope.fields = _(AssetContentType.fields).reduce(function (acc, field) {
      if (!field.disabled || scope.preferences.showDisabledFields || errorPaths[field.id]) {
        var locales;
        if (field.localized) {
          locales = scope.spaceContext.activeLocales;
          var errorLocales = _.map(errorPaths[field.id], function (code) {
            return scope.spaceContext.getPublishLocale(code);
          });
          locales = _.union(locales, errorLocales);
        } else {
          locales = [scope.spaceContext.space.getDefaultLocale()];
        }
        acc.push(inherit(field, {
          locales: locales
        }));
      }
      return acc;
    }, []);

    function inherit(source, extensions){
      var Clone = function () { };
      Clone.prototype = source;
      var clone = new Clone();
      return _.extend(clone, extensions);
    }
  }

  var firstValidate = $scope.$on('otBecameEditable', function (event) {
    var scope = event.currentScope;
    if (!_.isEmpty(scope.asset.data.fields)) scope.validate();
    firstValidate();
  });

  $scope.showLangSwitcher = $scope.spaceContext.space.getPublishLocales().length > 1;

  $scope.$watch('validationResult.errors', function (errors) {
    errorPaths = {};
    $scope.hasErrorOnFields = false;

    _.each(errors, function (error) {
      if (error.path[0] !== 'fields') return;
      var field      = error.path[1];
      errorPaths[field] = errorPaths[field] || [];

      if (error.path.length == 1 && error.path[0] == 'fields') {
        $scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      } else if (error.path.length == 2) {
        errorPaths[field].push($scope.spaceContext.space.getDefaultLocale().code);
      } else {
        var localeCode = error.path[2];
        errorPaths[field].push(localeCode);
      }
      errorPaths[field] = _.unique(errorPaths[field]);
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

  $scope.$on('fileUploaded', function (event, file, locale) {
    var localeCode = locale.code;
    $scope.asset.process($scope.otDoc.version, locale.code, function (err) {
      if (err) {
        notification.serverError('There has been a problem processing the Asset.', err);
        console.log('asset processing error', err);
      } else {
        setTitleOnDoc(file, localeCode);
      }
    });
  });

  $scope.$watch('asset.data.fields.file', function (file, old, scope) {
    if (file !== old) scope.validate();
  }, true);

  $scope.headline = function(){
    return this.spaceContext.assetTitle(this.asset);
  };

}]);
