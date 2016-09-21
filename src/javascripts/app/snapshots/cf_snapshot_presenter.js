'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSnapshotPresenter
 */
.directive('cfSnapshotPresenter', [function () {
  return {
    restrict: 'E',
    template: JST.cf_snapshot_presenter(),
    controller: ['$scope', function ($scope) {
      $scope.value = $scope.fieldLocale.doc.get();
      $scope.noValueType = getNoValueType($scope.value);
      $scope.hasValue = !$scope.noValueType;

      var field = $scope.widget.field;
      $scope.type = getFieldType(field);
      $scope.linkType = dotty.get(field, 'linkType', dotty.get(field, 'items.linkType'));
    }]
  };

  function getFieldType (field) {
    if (field.type === 'Array') {
      var itemsType = field.items.type;
      return referenceOr(itemsType, 'Array<' + itemsType + '>');
    } else {
      return referenceOr(field.type);
    }
  }

  function referenceOr (type, alt) {
    return type === 'Link' ? 'Reference' : (alt || type);
  }

  function getNoValueType (val) {
    if (val === null) {
      return 'null';
    } else if (val === undefined) {
      return 'undefined';
    } else if (val === '') {
      return 'empty string';
    } else if (_.isEqual(val, [])) {
      return 'empty array';
    } else if (_.isEqual(val, {})) {
      return 'empty object';
    }
  }
}])

.directive('cfSnapshotPresenterMarkdown', ['require', function (require) {
  var startPreview = require('MarkdownEditor/preview');

  return {
    restrict: 'E',
    template: '<cf-markdown-preview preview="preview" />',
    controller: ['$scope', function ($scope) {
      startPreview(_.constant($scope.value), function (_err, preview) {
        $scope.preview = preview;
      });
    }]
  };
}])

.directive('cfSnapshotPresenterLink', ['require', function (require) {
  var spaceContext = require('spaceContext');
  var EntityStore = require('EntityStore');
  var EntityHelpers = require('EntityHelpers');

  var FETCH_METHODS = {
    Asset: 'getAssets',
    Entry: 'getEntries'
  };

  return {
    restrict: 'E',
    template: '<cf-entity-link ng-repeat="item in value" ng-if="ready" is-disabled="true" link="item" entity-store="store" entity-helpers="helper" config="config" />',
    controller: ['$scope', function ($scope) {
      if (!Array.isArray($scope.value)) {
        $scope.value = [$scope.value];
      }

      $scope.store = EntityStore.create(spaceContext.cma, FETCH_METHODS[$scope.linkType]);

      $scope.store.prefetch($scope.value)
      .then(function () {
        $scope.ready = true;
      });

      $scope.helper = EntityHelpers.newForLocale($scope.locale.code);
      $scope.config = {};
    }]
  };
}]);
