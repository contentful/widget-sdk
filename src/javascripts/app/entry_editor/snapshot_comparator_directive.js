'use strict';

angular.module('contentful')

.directive('cfSnapshotComparator', [function () {
  return {
    template: JST.snapshot_comparator(),
    restrict: 'E',
    controller: 'SnapshotComparatorController'
  };
}])

.controller('SnapshotComparatorController', ['require', '$scope', function (require, $scope) {
  var spaceContext = require('spaceContext');
  var SnapshotDoc = require('SnapshotComparatorController/snapshotDoc');
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var Command = require('command');

  $scope.context.title = spaceContext.entryTitle($scope.entry);
  $scope.otDoc = SnapshotDoc.create($scope.entry);

  $scope.save = Command.create(_.noop, {disabled: _.constant(true)});
  $scope.restore = restore;

  var contentTypeData = $scope.contentType.data;
  var fields = contentTypeData.fields;
  $scope.fields = DataFields.create(fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(contentTypeData);

  function restore () {
    // Not implemented
  }
}])

.factory('SnapshotComparatorController/snapshotDoc', ['require', function (require) {
  var $q = require('$q');
  var K = require('utils/kefir');

  var resolve = _.constant($q.resolve());

  return {create: create};

  function create (snapshot) {
    return {
      getValueAt: valueAt,
      valuePropertyAt: valuePropertyAt,

      setValueAt: resolve,
      removeValueAt: resolve,
      insertValueAt: resolve,
      pushValueAt: resolve,
      moveValueAt: resolve,

      collaboratorsFor: _.constant(K.constant([]))
    };

    function valuePropertyAt (path) {
      return K.constant(valueAt(path));
    }

    function valueAt (path) {
      return dotty.get(snapshot, ['data'].concat(path));
    }
  }
}])

.controller('SnapshotFieldController', ['require', '$scope', function (require, $scope) {
  var store = require('TheLocaleStore');
  var K = require('utils/kefir');

  var field = $scope.widget.field;
  var locales = field.localized ? store.getPrivateLocales() : [store.getDefaultLocale()];

  $scope.field = field;
  $scope.locales = _.filter(locales, store.isLocaleActive);

  $scope.validator = {errors$: K.constant([])};
  $scope.state = {registerPublicationWarning: _.constant(_.noop)};

  this.setInvalid = _.noop;
}]);
