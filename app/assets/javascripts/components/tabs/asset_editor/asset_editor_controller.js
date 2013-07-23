'use strict';

angular.module('contentful').controller('AssetEditorCtrl', function AssetEditorCtrl($scope, ShareJS, validation, can) {
  $scope.$watch('tab.params.asset', 'asset=tab.params.asset');
  $scope.$watch(function assetEditorEnabledWatcher(scope) {
    return !scope.asset.isArchived() && can('update', scope.asset.data);
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

  // TODO not yet implemented
  //$scope.assetSchema = validation.forAsset($scope.spaceContext.space.getPublishLocales());

  $scope.publishedAt = function(){
    if (!$scope.otDoc) return;
    var val = $scope.otDoc.getAt(['sys', 'publishedAt']);
    if (val) {
      return new Date(val);
    } else {
      return undefined;
    }
  };

  $scope.$watch(function (scope) {
    if (scope.otDoc && scope.asset) {
      if (angular.isDefined(scope.asset.data.sys.publishedVersion))
        return scope.otDoc.version > scope.asset.data.sys.publishedVersion + 1;
      else
        return 'draft';
    } else {
      return undefined;
    }
  }, function (modified, old, scope) {
    if (modified !== undefined) scope.tab.dirty = modified;
  });

  //$scope.$watch(function (scope) {
    //return _.pluck(scope.spaceContext.activeLocales, 'code');
  //}, updateFields, true);
  //$scope.$watch('spaceContext.space.getDefaultLocale()', updateFields);
  //$scope.$watch(function () { return errorPaths; }, updateFields);
  //var errorPaths = {};

  //function updateFields(n, o ,scope) {
    
    //var et = scope.spaceContext.publishedTypeForAsset(scope.asset);
    //if (!et) return;
    //scope.fields = _(et.data.fields).reduce(function (acc, field) {
      //if (!field.disabled || scope.preferences.showDisabledFields || errorPaths[field.id]) {
        //var locales;
        //if (field.localized) {
          //locales = scope.spaceContext.activeLocales;
          //var errorLocales = _.map(errorPaths[field.id], function (code) {
            //return scope.spaceContext.getPublishLocale(code);
          //});
          //locales = _.union(locales, errorLocales);
        //} else {
          //locales = [scope.spaceContext.space.getDefaultLocale()];
        //}
        //acc.push(inherit(field, locales));
      //}
      //return acc;
    //}, []);

    //function inherit(source, locales){
      //var Clone = function () { };
      //Clone.prototype = source;
      //var clone = new Clone();
      //clone.locales = locales;
      //return clone;
    //}
  //}

  //var firstValidate = $scope.$on('otBecameEditable', function (event) {
    //var scope = event.currentScope;
    //scope.validate();
    //firstValidate();
  //});

  //$scope.$watch('validationResult.errors', function (errors) {
    //errorPaths = {};
    //$scope.hasErrorOnFields = false;

    //_.each(errors, function (error) {
      //if (error.path[0] !== 'fields') return;
      //var field      = error.path[1];
      //errorPaths[field] = errorPaths[field] || [];

      //if (error.path.length == 1 && error.path[0] == 'fields') {
        //$scope.hasErrorOnFields = error.path.length == 1 && error.path[0] == 'fields';
      //} else if (error.path.length == 2) {
        //var allCodes = _.pluck($scope.spaceContext.publishLocales, 'code');
        //errorPaths[field].push.apply(errorPaths[field], allCodes);
      //} else {
        //var localeCode = error.path[2];
        //errorPaths[field].push(localeCode);
      //}
      //errorPaths[field] = _.unique(errorPaths[field]);
    //});
  //});

  $scope.headline = function(){
    return this.spaceContext.assetTitle(this.asset);
  };

});
