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
}])

.directive('cfSnapshotPresenterDate', ['require', function (require) {
  var Data = require('widgets/datetime/data');
  var moment = require('moment');

  return {
    restrict: 'E',
    template: '<span>{{ dtString }}</span>',
    controller: ['$scope', function ($scope) {
      var dt = Data.userInputFromDatetime($scope.value);
      var mode = dotty.get($scope, 'widget.settings.format', 'date');
      var s = moment(dt.date).format('dddd, MMMM Do YYYY');

      if (mode === 'date') {
        $scope.dtString = s;
        return;
      }

      if (parseInt(dotty.get($scope, 'widget.settings.ampm'), 10) !== 24) {
        var x = dt.time.split(':');
        s += ', ' + moment().hour(x[0]).minute(x[1]).format('LT');
      } else {
        s += ', ' + dt.time;
      }

      if (mode === 'timeZ') {
        s += ', UTC' + dt.utcOffset;
      }

      $scope.dtString = s;
    }]
  };
}]);
