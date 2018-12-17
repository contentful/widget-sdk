import { registerDirective, registerController } from 'NgRegistry.es6';
import _ from 'lodash';
import * as K from 'utils/kefir.es6';
import { Notification } from '@contentful/forma-36-react-components';
import * as Focus from 'app/entity_editor/Focus.es6';
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
}))

registerController('SnapshotComparatorController', [
  '$scope',
  '$q',
  '$state',
  '$stateParams',
  'spaceContext',
  'SnapshotComparatorController/snapshotDoc',
  'EntityEditor/DataFields',
  'data/ContentTypes',
  'data/Entries',
  'command',
  'analyticsEvents/versioning',
  'app/entity_editor/Validator.es6',
  (
    $scope,
    $q,
    $state,
    $stateParams,
    spaceContext,
    SnapshotDoc,
    DataFields,
    ContentTypes,
    Entries,
    Command,
    trackVersioning,
    Validator
  ) => {
    $scope.versionPicker = versionPicker.create();
    $scope.snapshotCount = $stateParams.snapshotCount;

    $scope.context.ready = true;
    $scope.context.title = spaceContext.entryTitle($scope.entry);
    $scope.context.requestLeaveConfirmation = trackVersioning.trackableConfirmator(save);

    $scope.editorContext = {
      validator: Validator.createNoop(),
      entityInfo: $scope.entityInfo,
      focus: Focus.create()
    };

    $scope.$watch(
      () => $scope.versionPicker.getPathsToRestore().length > 0,
      isDirty => {
        $scope.context.dirty = isDirty;
      }
    );

    const ctData = $scope.contentType.data;
    const snapshotData = $scope.snapshot.snapshot || {};

    let isShowingSnapshotSelector = false;
    const showSnapshotSelectorBus = K.createPropertyBus(isShowingSnapshotSelector, $scope);

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
      const snapshot = Entries.internalToExternal(snapshotData, ctData);
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
])

registerController('SnapshotFieldController', [
  '$scope',
  'TheLocaleStore',
  function($scope, localeStore) {
    const field = $scope.widget.field;
    const locales = field.localized ? localeStore.getPrivateLocales() : [localeStore.getDefaultLocale()];

    $scope.field = field;
    $scope.locales = _.filter(locales, localeStore.isLocaleActive);

    $scope.state = { registerUnpublishedReferencesWarning: _.constant(_.noop) };

    this.setInvalid = _.noop;
  }
])

registerController('SnapshotComparisonController', [
  '$scope',
  $scope => {
    const field = $scope.field;
    const locale = $scope.locale;
    const fieldPath = ['fields', field.id, locale.internal_code];

    const canEdit = $scope.otDoc.permissions.canEditFieldLocale(field.apiName, locale.code);

    const currentVersion = $scope.otDoc.getValueAt(fieldPath);
    const snapshotVersion = $scope.snapshotDoc.getValueAt(fieldPath);

    $scope.isDifferent = !_.isEqual(currentVersion, snapshotVersion);
    $scope.isDisabled = $scope.field.disabled || !canEdit;
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
