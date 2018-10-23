'use strict';

angular
  .module('cf.app')
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
  .directive('cfSnapshotComparator', [
    () => ({
      template: JST.snapshot_comparator(),
      restrict: 'E',
      controller: 'SnapshotComparatorController'
    })
  ])

  .controller('SnapshotComparatorController', [
    'require',
    '$scope',
    (require, $scope) => {
      const $q = require('$q');
      const K = require('utils/kefir.es6');
      const spaceContext = require('spaceContext');
      const SnapshotDoc = require('SnapshotComparatorController/snapshotDoc');
      const DataFields = require('EntityEditor/DataFields');
      const ContentTypes = require('data/ContentTypes');
      const Entries = require('data/Entries');
      const Command = require('command');
      const $state = require('$state');
      const $stateParams = require('$stateParams');
      const notification = require('notification');
      const trackVersioning = require('analyticsEvents/versioning');
      const Validator = require('app/entity_editor/Validator.es6');
      const Focus = require('app/entity_editor/Focus.es6');

      $scope.versionPicker = require('app/snapshots/VersionPicker.es6').create();
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
            notification.info('Entry successfully restored.');
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
          notification.error('Versions do not match. Please reload the version first.');
        } else {
          notification.error('Changes could not be reverted. Please try again.');
        }

        return $q.reject(error);
      }
    }
  ])

  .controller('SnapshotFieldController', [
    'require',
    '$scope',
    function(require, $scope) {
      const store = require('TheLocaleStore');

      const field = $scope.widget.field;
      const locales = field.localized ? store.getPrivateLocales() : [store.getDefaultLocale()];

      $scope.field = field;
      $scope.locales = _.filter(locales, store.isLocaleActive);

      $scope.state = { registerPublicationWarning: _.constant(_.noop) };

      this.setInvalid = _.noop;
    }
  ])

  .controller('SnapshotComparisonController', [
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
