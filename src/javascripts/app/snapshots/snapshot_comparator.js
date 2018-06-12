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
.directive('cfSnapshotComparator', [() => ({
  template: JST.snapshot_comparator(),
  restrict: 'E',
  controller: 'SnapshotComparatorController'
})])

.controller('SnapshotComparatorController', ['require', '$scope', (require, $scope) => {
  var $q = require('$q');
  var K = require('utils/kefir');
  var spaceContext = require('spaceContext');
  var SnapshotDoc = require('SnapshotComparatorController/snapshotDoc');
  var DataFields = require('EntityEditor/DataFields');
  var ContentTypes = require('data/ContentTypes');
  var Entries = require('data/Entries');
  var Command = require('command');
  var $state = require('$state');
  var $stateParams = require('$stateParams');
  var notification = require('notification');
  var trackVersioning = require('analyticsEvents/versioning');
  var Validator = require('app/entity_editor/Validator');
  var Focus = require('app/entity_editor/Focus');

  $scope.versionPicker = require('SnapshotComparatorController/versionPicker').create();
  $scope.snapshotCount = $stateParams.snapshotCount;

  $scope.context.ready = true;
  $scope.context.title = spaceContext.entryTitle($scope.entry);
  $scope.context.requestLeaveConfirmation = trackVersioning.trackableConfirmator(save);

  $scope.editorContext = {
    validator: Validator.createNoop(),
    entityInfo: $scope.entityInfo,
    focus: Focus.create()
  };

  $scope.$watch(() => $scope.versionPicker.getPathsToRestore().length > 0, isDirty => {
    $scope.context.dirty = isDirty;
  });

  var ctData = $scope.contentType.data;
  var snapshotData = $scope.snapshot.snapshot || {};

  var isShowingSnapshotSelector = false;
  var showSnapshotSelectorBus = K.createPropertyBus(isShowingSnapshotSelector, $scope);

  $scope.toggleSnapshotSelector = () => {
    isShowingSnapshotSelector = !isShowingSnapshotSelector;
    showSnapshotSelectorBus.set(isShowingSnapshotSelector);
  };
  $scope.isShowingSnapshotSelector = () => isShowingSnapshotSelector;
  $scope.showSnapshotSelector$ = showSnapshotSelectorBus.property;

  $scope.showOnlyDifferences = false;
  $scope.otDoc = SnapshotDoc.create(_.get($scope, 'entry.data', {}));
  $scope.snapshotDoc = SnapshotDoc.create(snapshotData);
  $scope.fields = DataFields.create(ctData.fields, $scope.otDoc);
  $scope.transformedContentTypeData = ContentTypes.internalToPublic(ctData);

  $scope.goToSnapshot = goToSnapshot;
  $scope.close = close;
  $scope.save = Command.create(_.partial(save, true), {
    disabled: function () { return !$scope.context.dirty; }
  });

  function goToSnapshot (snapshot) {
    $scope.context.ready = false;
    setPristine();
    $state.go('.', {snapshotId: snapshot.sys.id, source: 'compareView'});
  }

  function close () {
    if (!$scope.context.dirty) {
      trackVersioning.closed();
    }

    return $state.go('^.^');
  }

  function save (redirect) {
    return spaceContext.cma.updateEntry(prepareRestoredEntry())
    .then(entry => {
      trackVersioning.registerRestoredVersion(entry);
      trackVersioning.restored($scope.versionPicker, $scope.showOnlyDifferences);
      setPristine();
      if (redirect) {
        return $state.go('^.^', {}, {reload: true});
      }
    }, handleSaveError)
    .then(() => {
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
    .forEach(path => {
      path = Entries.internalPathToExternal(ctData, path);
      _.set(result, path, _.get(snapshot, path));
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

  var field = $scope.widget.field;
  var locales = field.localized ? store.getPrivateLocales() : [store.getDefaultLocale()];

  $scope.field = field;
  $scope.locales = _.filter(locales, store.isLocaleActive);

  $scope.state = {registerPublicationWarning: _.constant(_.noop)};

  this.setInvalid = _.noop;
}])

.controller('SnapshotComparisonController', ['$scope', $scope => {
  var field = $scope.field;
  var locale = $scope.locale;
  var fieldPath = ['fields', field.id, locale.internal_code];

  var canEdit =
    $scope.otDoc.permissions.canEditFieldLocale(field.apiName, locale.code);

  var currentVersion = $scope.otDoc.getValueAt(fieldPath);
  var snapshotVersion = $scope.snapshotDoc.getValueAt(fieldPath);

  $scope.isDifferent = !_.isEqual(currentVersion, snapshotVersion);
  $scope.isDisabled = $scope.field.disabled || !canEdit;
  $scope.canRestore = $scope.isDifferent && !$scope.isDisabled;

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
