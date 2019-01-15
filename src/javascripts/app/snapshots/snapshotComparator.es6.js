import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import { Notification } from '@contentful/forma-36-react-components';
import * as versionPicker from 'app/snapshots/VersionPicker.es6';

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
registerDirective('cfSnapshotComparator', () => ({
  template: JST.snapshot_comparator(),
  restrict: 'E',
  controller: 'SnapshotComparatorController'
}));

registerController('SnapshotComparatorController', [
  '$scope',
  '$q',
  '$state',
  '$stateParams',
  'spaceContext',
  'data/Entries',
  'command',
  'analyticsEvents/versioning',
  'TheLocaleStore',
  (
    $scope,
    $q,
    $state,
    $stateParams,
    spaceContext,
    Entries,
    Command,
    trackVersioning,
    TheLocaleStore
  ) => {
    $scope.versionPicker = versionPicker.create();
    $scope.snapshotCount = $stateParams.snapshotCount;

    $scope.context.ready = true;
    $scope.context.title = spaceContext.entryTitle($scope.entry);
    $scope.context.requestLeaveConfirmation = trackVersioning.trackableConfirmator(save);

    $scope.localesForField = $scope.widgets.reduce((acc, { field }) => {
      const fieldLocales = field.localized
        ? TheLocaleStore.getPrivateLocales()
        : [TheLocaleStore.getDefaultLocale()];

      return { ...acc, [field.id]: fieldLocales.filter(TheLocaleStore.isLocaleActive) };
    }, {});

    $scope.$watch(
      () => $scope.versionPicker.getPathsToRestore().length > 0,
      isDirty => {
        $scope.context.dirty = isDirty;
      }
    );

    let isShowingSnapshotSelector = false;
    const showSnapshotSelectorBus = K.createPropertyBus(isShowingSnapshotSelector, $scope);

    $scope.toggleSnapshotSelector = () => {
      isShowingSnapshotSelector = !isShowingSnapshotSelector;
      showSnapshotSelectorBus.set(isShowingSnapshotSelector);
    };
    $scope.isShowingSnapshotSelector = () => isShowingSnapshotSelector;
    $scope.showSnapshotSelector$ = showSnapshotSelectorBus.property;

    $scope.showOnlyDifferences = false;

    $scope.goToSnapshot = goToSnapshot;
    $scope.close = close;
    $scope.save = Command.create(_.partial(save, true), {
      disabled: function() {
        return !$scope.context.dirty;
      }
    });

    function goToSnapshot(snapshot) {
      $scope.context.ready = false;
      setPristine();
      $state.go('.', { snapshotId: snapshot.sys.id, source: 'compareView' });
    }

    function close() {
      if (!$scope.context.dirty) {
        trackVersioning.closed();
      }

      return $state.go('^.^');
    }

    function save(redirect) {
      return spaceContext.cma
        .updateEntry(prepareRestoredEntry())
        .then(entry => {
          trackVersioning.registerRestoredVersion(entry);
          trackVersioning.restored($scope.versionPicker, $scope.showOnlyDifferences);
          setPristine();
          if (redirect) {
            return $state.go('^.^', {}, { reload: true });
          }
        }, handleSaveError)
        .then(() => {
          Notification.success('Entry successfully restored.');
        });
    }

    function setPristine() {
      $scope.versionPicker.keepAll();
      $scope.context.dirty = false;
    }

    function prepareRestoredEntry() {
      const ctData = $scope.contentType.data || {};
      const snapshot = Entries.internalToExternal($scope.snapshot.snapshot || {}, ctData);
      const result = Entries.internalToExternal($scope.entry.data, ctData);

      $scope.versionPicker.getPathsToRestore().forEach(path => {
        path = Entries.internalPathToExternal(ctData, path);
        _.set(result, path, _.get(snapshot, path));
      });

      return result;
    }

    function handleSaveError(error) {
      if (error.code === 'VersionMismatch') {
        Notification.error('Versions do not match. Please reload the version first.');
      } else {
        Notification.error('Changes could not be reverted. Please try again.');
      }

      return $q.reject(error);
    }
  }
]);

registerController('SnapshotComparisonController', [
  '$scope',
  'access_control/EntityPermissions.es6',
  ($scope, Permissions) => {
    const field = $scope.widget.field;
    const locale = $scope.locale;
    const fieldPath = ['fields', field.id, locale.internal_code];

    const canEdit = Permissions.create(
      _.get($scope, ['entry', 'data', 'sys'], {})
    ).canEditFieldLocale(field.apiName, locale.code);

    const currentVersion = _.get($scope.entry, ['data'].concat(fieldPath));
    const snapshotVersion = _.get($scope.snapshot, ['snapshot'].concat(fieldPath));

    $scope.isDifferent = !_.isEqual(currentVersion, snapshotVersion);
    $scope.isDisabled = field.disabled || !canEdit;
    $scope.canRestore = $scope.isDifferent && !$scope.isDisabled;

    $scope.select = $scope.isDifferent ? select : _.noop;
    $scope.selected = 'current';

    $scope.versionPicker.registerPath({
      isDifferent: $scope.isDifferent,
      restoreFn: _.partial(select, 'snapshot')
    });

    function select(version) {
      if ($scope.canRestore) {
        const method = version === 'current' ? 'keep' : 'restore';
        $scope.versionPicker[method](fieldPath);
        $scope.selected = version;
      }
    }
  }
]);
