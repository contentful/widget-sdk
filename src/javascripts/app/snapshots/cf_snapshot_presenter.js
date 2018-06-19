'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSnapshotPresenter
 * @description
 * This directive "presents" value of a field.
 * Directives prefixed with "cfSnapshotPresenter..."
 * implement logic needed for specific field
 * types (if the type is complex enough).
 */
.directive('cfSnapshotPresenter', ['require', require => {
  var RTL_SUPPORT_FEATURE_FLAG =
    'feature-at-03-2018-rtl-support';

  var LD = require('utils/LaunchDarkly');
  var isRtlLocale = require('utils/locales').isRtlLocale;

  return {
    restrict: 'E',
    template: JST.cf_snapshot_presenter(),
    controller: ['$scope', $scope => {
      var field = $scope.widget.field;
      $scope.type = getFieldType(field);
      $scope.value = $scope.fieldLocale.doc.get();
      $scope.hasValue = !isEmpty($scope.value);
      $scope.isCustom = ($scope.widget.template || '').indexOf('cf-iframe-widget') > -1;
      $scope.linkType = _.get(field, 'linkType', _.get(field, 'items.linkType'));
      $scope.methods = {
        shouldDisplayRtl: _.constant(false)
      };

      LD.onFeatureFlag($scope, RTL_SUPPORT_FEATURE_FLAG, isEnabled => {
        // By default, all entity fields should be displayed as LTR unless the
        // RTL support feature flag is enabled.
        if (isEnabled) {
          $scope.methods.shouldDisplayRtl = isRtlLocale;
        }
      });
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

  function isEmpty (v) {
    return v === null || v === undefined || v === '' || _.isEqual(v, []) || _.isEqual(v, {});
  }
}])

.directive('cfSnapshotPresenterMarkdown', ['require', require => {
  var generatePreview = require('markdown_editor/PreviewGenerator').default;
  var K = require('utils/kefir');

  return {
    restrict: 'E',
    template: '<cf-markdown-preview class="markdown-preview" preview="preview" />',
    controller: ['$scope', $scope => {
      var markdown$ = K.fromScopeValue($scope, scope => scope.value);
      var preview$ = generatePreview(markdown$);
      K.onValueScope($scope, preview$, preview => {
        $scope.preview = preview.preview;
      });
    }]
  };
}])

.directive('cfSnapshotPresenterLink', ['require', require => {
  var spaceContext = require('spaceContext');
  var EntityResolver = require('data/CMA/EntityResolver');
  var EntityHelpers = require('EntityHelpers');

  return {
    restrict: 'E',
    template: '<cf-entity-link ' + [
      'ng-repeat="model in models"',
      'entity="model.entity"',
      'entity-helpers="helper"',
      'config="config"'
    ].join(' ') + ' />',
    controller: ['$scope', $scope => {
      var links = Array.isArray($scope.value) ? $scope.value : [$scope.value];
      var ids = links.map(link => link.sys.id);

      var store = EntityResolver.forType($scope.linkType, spaceContext.cma);

      store.load(ids)
      .then(results => {
        $scope.models = results.map(result => ({
          entity: result[1]
        }));
      });

      $scope.helper = EntityHelpers.newForLocale($scope.locale.code);
      $scope.config = { minimized: true };
    }]
  };
}])

.directive('cfSnapshotPresenterDate', ['require', require => {
  var Data = require('widgets/datetime/data');
  var moment = require('moment');

  return {
    restrict: 'E',
    template: '<span>{{ dtString }}</span>',
    controller: ['$scope', $scope => {
      var dt = Data.userInputFromDatetime($scope.value);
      var mode = _.get($scope, 'widget.settings.format', 'date');
      var s = moment(dt.date).format('dddd, MMMM Do YYYY');

      if (mode === 'date') {
        $scope.dtString = s;
        return;
      }

      if (parseInt(_.get($scope, 'widget.settings.ampm'), 10) !== 24) {
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
