'use strict';

angular.module('cf.app')

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
  var Entries = require('data/Entries');
  var Command = require('command');
  var modalDialog = require('modalDialog');
  var $state = require('$state');
  var $timeout = require('$timeout');
  var leaveConfirmator = require('navigation/confirmLeaveEditor');
  var notification = require('notification');

  $scope.versionPicker = require('SnapshotComparatorController/versionPicker').create();

  _.extend($scope.context, {
    ready: true,
    title: spaceContext.entryTitle($scope.entry),
    requestLeaveConfirmation: leaveConfirmator(save)
  });

  $scope.$watch($scope.versionPicker.isUntouched, function (untouched) {
    $scope.context.dirty = !untouched;
  });

  var ctData = $scope.contentType.data;
  var snapshotData = $scope.snapshot.snapshot || {};

  $scope.otDoc = SnapshotDoc.create(dotty.get($scope, 'entry.data', {}));
  $scope.snapshotDoc = SnapshotDoc.create(snapshotData);
  $scope.fields = DataFields.create(ctData.fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(ctData);

  $scope.selectSnapshot = selectSnapshot;
  $scope.save = Command.create(save, {
    disabled: $scope.versionPicker.isUntouched
  });

  function selectSnapshot () {
    return modalDialog.open({
      template: 'snapshot_selector',
      scopeData: {query: {}, currentId: $scope.snapshot.sys.id}
    }).promise.then(goToSnapshot);
  }

  function goToSnapshot (snapshot) {
    $scope.context.ready = false;
    $scope.versionPicker.keepAll();
    $timeout(function () {
      $state.go('.', {snapshotId: snapshot.sys.id});
    });
  }

  function save () {
    return spaceContext.cma.updateEntry(prepareRestoredEntry())
    .then(function () {
      $scope.versionPicker.keepAll();
      return $timeout(function () {
        return $state.go('^.^', {}, {reload: true});
      });
    }, handleSaveError);
  }

  function prepareRestoredEntry () {
    var snapshot = Entries.internalToExternal(snapshotData, ctData);
    var result = Entries.internalToExternal($scope.entry.data, ctData);

    $scope.versionPicker.getPathsToRestore()
    .forEach(function (path) {
      path = Entries.internalPathToExternal(path, ctData);
      dotty.put(result, path, dotty.get(snapshot, path));
    });

    return result;
  }

  function handleSaveError (error) {
    if (error.code === 'VersionMismatch') {
      notification.error('Versions do not match. Please reload the version first.');
    } else {
      notification.error('Changes could not be reverted. Please try again.');
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
}])

.controller('SnapshotComparisonController', ['$scope', function ($scope) {
  var fieldPath = ['fields', $scope.field.id, $scope.locale.internal_code];

  var currentVersion = $scope.otDoc.getValueAt(fieldPath);
  var snapshotVersion = $scope.snapshotDoc.getValueAt(fieldPath);

  $scope.isDifferent = !_.isEqual(currentVersion, snapshotVersion);
  $scope.canRestore = $scope.isDifferent && !$scope.field.disabled;

  $scope.select = $scope.isDifferent ? select : _.noop;
  $scope.selected = 'current';

  $scope.versionPicker.registerRestoreFn(_.partial(select, 'snapshot'));

  if ($scope.isDifferent) {
    $scope.versionPicker.registerDifference();
  }

  function select (version) {
    if ($scope.canRestore) {
      var method = version === 'current' ? 'keep' : 'restore';
      $scope.versionPicker[method](fieldPath);
      $scope.selected = version;
    }
  }
}]);
