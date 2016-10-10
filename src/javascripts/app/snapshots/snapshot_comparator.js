'use strict';

angular.module('cf.app')
/**
 * @ngdoc directive
 * @module cf.app
 * @name cfSnapshotComparator
 * @description
 * This directive is responsible for rendering
 * of the comparison view. Its controller (and
 * small child controllers) allow users to choose
 * between field versions and restore composed
 * version of an entry at the end of the process.
 */
.directive('cfSnapshotComparator', [function () {
  return {
    template: JST.snapshot_comparator(),
    restrict: 'E',
    controller: 'SnapshotComparatorController'
  };
}])

.controller('SnapshotComparatorController', ['require', '$scope', function (require, $scope) {
  var $q = require('$q');
  var spaceContext = require('spaceContext');
  var SnapshotDoc = require('SnapshotComparatorController/snapshotDoc');
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var Entries = require('data/Entries');
  var Command = require('command');
  var modalDialog = require('modalDialog');
  var $state = require('$state');
  var $stateParams = require('$stateParams');
  var notification = require('notification');
  var tracking = require('track/versioning');

  $scope.versionPicker = require('SnapshotComparatorController/versionPicker').create();
  $scope.snapshotCount = $stateParams.snapshotCount;

  _.extend($scope.context, {
    ready: true,
    title: spaceContext.entryTitle($scope.entry),
    requestLeaveConfirmation: tracking.trackableConfirmator(save)
  });

  $scope.$watch(function () {
    return $scope.versionPicker.getPathsToRestore().length > 0;
  }, function (isDirty) {
    $scope.context.dirty = isDirty;
  });

  var ctData = $scope.contentType.data;
  var snapshotData = $scope.snapshot.snapshot || {};

  $scope.showOnlyDifferences = false;
  $scope.otDoc = SnapshotDoc.create(dotty.get($scope, 'entry.data', {}));
  $scope.snapshotDoc = SnapshotDoc.create(snapshotData);
  $scope.fields = DataFields.create(ctData.fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(ctData);

  $scope.selectSnapshot = selectSnapshot;
  $scope.close = close;
  $scope.save = Command.create(_.partial(save, true), {
    disabled: function () { return !$scope.context.dirty; }
  });

  function selectSnapshot () {
    return modalDialog.open({
      template: 'snapshot_selector',
      scopeData: {currentId: $scope.snapshot.sys.id}
    }).promise.then(goToSnapshot);
  }

  function goToSnapshot (snapshot) {
    $scope.context.ready = false;
    setPristine();
    $state.go('.', {snapshotId: snapshot.sys.id, source: 'compareView'});
  }

  function close () {
    if (!$scope.context.dirty) {
      tracking.closed();
    }

    return $state.go('^.^');
  }

  function save (redirect) {
    return spaceContext.cma.updateEntry(prepareRestoredEntry())
    .then(function (entry) {
      tracking.registerRestoredVersion(entry);
      tracking.restored($scope.versionPicker, $scope.showOnlyDifferences);
      setPristine();
      if (redirect) {
        return $state.go('^.^', {}, {reload: true});
      }
    }, handleSaveError)
    .then(function () {
      notification.info('Entry successfully restored.');
    });
  }

  function setPristine () {
    $scope.versionPicker.keepAll();
    $scope.context.dirty = false;
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

    return $q.reject(error);
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

  $scope.versionPicker.registerPath({
    isDifferent: $scope.isDifferent,
    restoreFn: _.partial(select, 'snapshot')
  });

  function select (version) {
    if ($scope.canRestore) {
      var method = version === 'current' ? 'keep' : 'restore';
      $scope.versionPicker[method](fieldPath);
      $scope.selected = version;
    }
  }
}]);
