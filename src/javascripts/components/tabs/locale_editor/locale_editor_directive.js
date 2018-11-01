'use strict';

angular
  .module('contentful')
  .directive('cfLocaleEditor', [
    () => ({
      template: JST.locale_editor(),
      restrict: 'E',
      controller: 'LocaleEditorController',
      controllerAs: 'localeEditor'
    })
  ])

  /**
   * @ngdoc type
   * @name LocaleEditorController
   *
   * @scope.requires context
   * @scope.requires locale
   * @scope.requires spaceLocales
   * @scope.requires localeForm
   *
   * @scope.provides locales
   * @scope.provides fallbackLocales
   */
  .controller('LocaleEditorController', [
    '$scope',
    'require',
    function($scope, require) {
      const controller = this;
      const spaceContext = require('spaceContext');
      const TheLocaleStore = require('TheLocaleStore');
      const $q = require('$q');
      const modalDialog = require('modalDialog');
      const Command = require('command');
      const leaveConfirmator = require('navigation/confirmLeaveEditor');
      const $state = require('$state');
      const closeState = require('navigation/closeState');
      const localeList = require('data/LocaleList.es6').create($scope.spaceLocales);
      const notify = require('LocaleEditor/notifications');
      const React = require('react');
      const ModalLauncher = require('app/common/ModalLauncher.es6');
      const LocaleRemovalConfirmDialog = require('app/settings/locales/dialogs/LocaleRemovalConfirmDialog.es6')
        .default;

      let formWasDirty = false;
      let persistedLocaleCode = null;

      $scope.locales = localeList.prepareLocaleList($scope.locale);
      onLoadOrUpdate();

      $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

      $scope.$watch('localeForm.$dirty', modified => {
        $scope.context.dirty = modified;
      });

      $scope.$watch('locale.code', code => {
        $scope.context.title = prepareTitle();
        clearFallbackIfTheSame(code);
        $scope.fallbackLocales = localeList.prepareFallbackList(code);
      });

      function onLoadOrUpdate() {
        const code = $scope.locale.code;
        persistedLocaleCode = code;
        $scope.hasDependantLocales = localeList.hasDependantLocales(code);
      }

      function prepareTitle() {
        const name = getLocaleName();
        const empty = $scope.locale.sys.id ? 'Unnamed locale' : 'New locale';
        return name || empty;
      }

      function getLocaleName() {
        const code = $scope.locale.code;
        const locale = findLocale(code);
        return locale && locale.name;
      }

      function findLocale(code) {
        return _.find($scope.locales, { code: code });
      }

      // sometimes a code is selected as a fallback code, but then
      // the same code is selected as the code of the locale;
      // in this situation we clear the fallback code;
      // it cannot happen in the opposite direction (list is filtered)
      function clearFallbackIfTheSame(code) {
        if (code && $scope.locale.fallbackCode === code) {
          $scope.locale.fallbackCode = null;
        }
      }

      /**
       * @ngdoc method
       * @name LocaleEditorController#delete
       * @type {Command}
       */
      controller.delete = Command.create(startDeleteFlow, {
        available: function() {
          return !$scope.context.isNew && $scope.locale.sys.id && !$scope.locale.default;
        }
      });

      function startDeleteFlow() {
        lockFormWhileSubmitting();
        return openConfirmationDialog().then(result => {
          if (result.confirmed) {
            return maybeOpenFallbackLocaleChangeDialog().then(
              deleteLocale,
              resetFormStatusOnFailure
            );
          } else {
            return resetFormStatusOnFailure();
          }
        });
      }

      function openConfirmationDialog() {
        const locale = $scope.locale;
        return ModalLauncher.open(({ isShown, onClose }) => (
          <LocaleRemovalConfirmDialog
            isShown={isShown}
            locale={locale}
            onConfirm={() => {
              onClose({ confirmed: true });
            }}
            onCancel={() => {
              onClose({ cancelled: true });
            }}
          />
        ));
      }

      function maybeOpenFallbackLocaleChangeDialog() {
        if (localeList.hasDependantLocales($scope.locale.code)) {
          return openFallbackLocaleChangeDialog();
        } else {
          return $q.resolve();
        }
      }

      function openFallbackLocaleChangeDialog() {
        const locale = $scope.locale;
        const dependantLocales = localeList.getDependantLocales(locale.code);
        return modalDialog
          .open({
            template:
              '<react-component class="modal-background" name="app/settings/locales/dialogs/ChooseNewFallbackLocaleDialog.es6" props="props" />',
            controller: modalScope => {
              modalScope.props = {
                locale,
                dependantLocaleNames: prepareDependantLocaleNames(dependantLocales),
                availableLocales: localeList.getAvailableFallbackLocales(locale.code),
                onConfirm: value => modalScope.dialog.confirm(value),
                onCancel: err =>
                  modalScope.dialog.cancel(err instanceof Error ? err : { cancelled: true })
              };
            }
          })
          .promise.then(newFallbackCode => {
            const updates = _.map(dependantLocales, fallbackUpdater(newFallbackCode));
            return $q.all(updates).catch(() => {
              notify.codeChangeError();
              return $q.reject();
            });
          });
      }

      function prepareDependantLocaleNames(dependantLocales) {
        if (dependantLocales.length > 4) {
          const rest = ' and ' + (dependantLocales.length - 3) + ' other locales';
          return _.map(dependantLocales.slice(0, 3), 'name').join(', ') + rest;
        } else {
          return _.map(dependantLocales, 'name').join(', ');
        }
      }

      function fallbackUpdater(newFallbackCode) {
        return locale => {
          const localeToUpdate = _.find($scope.spaceLocales, { code: locale.code });
          if (localeToUpdate) {
            const data = _.cloneDeep(localeToUpdate);
            data.fallbackCode = newFallbackCode;
            return spaceContext.localeRepo.save(data);
          } else {
            return $q.resolve();
          }
        };
      }

      function deleteLocale() {
        const sys = $scope.locale.sys;
        return spaceContext.localeRepo.remove(sys.id, sys.version).then(
          function deletedSuccesfully() {
            return TheLocaleStore.refresh()
              .then(() => closeState())
              .finally(notify.deleteSuccess);
          },
          function errorDeletingLocale(err) {
            resetFormStatusOnFailure();
            notify.deleteError(err);
          }
        );
      }

      /**
       * @ngdoc property
       * @name LocaleEditorController#cancel
       * @type {Command}
       */
      controller.cancel = Command.create(
        function cancel() {
          // X.detail -> X.list
          return $state.go('^.list');
        },
        {
          available: function() {
            return $scope.context.isNew;
          }
        }
      );

      /**
       * @ngdoc property
       * @name LocaleEditorController#save
       * @type {Command}
       */
      controller.save = Command.create(save, {
        disabled: function() {
          const form = $scope.localeForm;
          return form.$invalid || !form.$dirty || !$scope.locale.code;
        }
      });

      function save() {
        if ($scope.hasDependantLocales && wasLocaleCodeChanged()) {
          notify.notRenameable();
          return $q.reject();
        }

        $scope.locale.name = getLocaleName();
        lockFormWhileSubmitting();
        return confirmCodeChange().then(result => {
          if (result.confirmed) {
            return spaceContext.localeRepo
              .save($scope.locale)
              .then(saveSuccessHandler)
              .catch(saveErrorHandler);
          } else {
            return resetFormStatusOnFailure();
          }
        });
      }

      function saveSuccessHandler(locale) {
        $scope.locale = locale;
        $scope.localeForm.$setPristine();
        $scope.context.dirty = false;
        return TheLocaleStore.refresh().then(() => {
          onLoadOrUpdate();
          notify.saveSuccess();
          if ($scope.context.isNew) {
            return $state.go('^.detail', {
              localeId: $scope.locale.sys.id
            });
          }
        });
      }

      function saveErrorHandler(err) {
        notify.saveError(err);
        resetFormStatusOnFailure();
      }

      function confirmCodeChange() {
        if (wasLocaleCodeChanged()) {
          const locale = $scope.locale;
          const previousLocale = {
            code: persistedLocaleCode,
            name: findLocale(persistedLocaleCode).name
          };
          return modalDialog.openConfirmDialog({
            template:
              '<react-component class="modal-background" name="app/settings/locales/dialogs/LocaleCodeChangeConfirmDialog.es6" props="props" />',
            controller: modalScope => {
              modalScope.props = {
                locale,
                previousLocale,
                onConfirm: value => modalScope.dialog.confirm(value),
                onCancel: err =>
                  modalScope.dialog.cancel(err instanceof Error ? err : { cancelled: true })
              };
            }
          });
        } else {
          return $q.resolve({ confirmed: true });
        }
      }

      function wasLocaleCodeChanged() {
        return persistedLocaleCode && persistedLocaleCode !== $scope.locale.code;
      }

      function lockFormWhileSubmitting() {
        formWasDirty = $scope.localeForm.$dirty;
        $scope.localeForm.$setSubmitted();
      }

      function resetFormStatusOnFailure() {
        $scope.localeForm.$setPristine();
        if (formWasDirty) {
          $scope.localeForm.$setDirty();
        }
      }
    }
  ])

  .factory('LocaleEditor/notifications', [
    'require',
    require => {
      const notification = require('notification');
      const logger = require('logger');

      const NOT_RENAMEABLE_MESSAGE =
        'Cannot change the code of a locale which is fallback of another one';
      const ERROR_CHECKS = [
        {
          message: 'This locale already exists',
          check: _.partial(checkUnprocessableEntityErrorName, 'taken')
        },
        {
          message: 'Fallback setting creates a loop',
          check: _.partial(checkUnprocessableEntityErrorName, 'fallback locale creates a loop')
        },
        {
          message: NOT_RENAMEABLE_MESSAGE,
          check: function(err) {
            return status === 403 && _.get(err, 'body.sys.id') === 'FallbackLocaleNotRenameable';
          }
        }
      ];

      return {
        deleteSuccess: deleteSuccess,
        saveSuccess: saveSuccess,
        notRenameable: notRenameable,
        codeChangeError: codeChangeError,
        deleteError: deleteError,
        saveError: saveError
      };

      function deleteSuccess() {
        notification.info('Locale deleted successfully');
      }

      function saveSuccess() {
        notification.info('Locale saved successfully');
      }

      function notRenameable() {
        notification.error(NOT_RENAMEABLE_MESSAGE);
      }

      function codeChangeError() {
        notification.error('New fallback code could not be saved');
      }

      function deleteError(err) {
        notification.error('Locale could not be deleted: ' + err.body.message);
        logger.logServerWarn('Locale could not be deleted', { error: err });
      }

      function saveError(err) {
        const message = getErrorMessage(err);
        if (message) {
          notification.error('Locale could not be saved: ' + message);
        } else {
          notification.error('Locale could not be saved');
          logger.logServerWarn('Locale could not be saved', { error: err });
        }
      }

      function getErrorMessage(err) {
        const found = _.find(ERROR_CHECKS, item => item.check(err));

        return found && found.message;
      }

      function checkUnprocessableEntityErrorName(name, err) {
        const status = _.get(err, 'statusCode');
        const errors = _.get(err, 'body.details.errors');

        return status === 422 && errors && errors.length > 0 && errors[0].name === name;
      }
    }
  ]);
