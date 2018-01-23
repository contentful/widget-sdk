'use strict';

angular.module('contentful')
.directive('cfLocaleEditor', [function () {
  return {
    template: JST.locale_editor(),
    restrict: 'E',
    controller: 'LocaleEditorController',
    controllerAs: 'localeEditor'
  };
}])

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
.controller('LocaleEditorController', ['$scope', 'require', function ($scope, require) {
  var controller = this;
  var spaceContext = require('spaceContext');
  var TheLocaleStore = require('TheLocaleStore');
  var $q = require('$q');
  var modalDialog = require('modalDialog');
  var Command = require('command');
  var leaveConfirmator = require('navigation/confirmLeaveEditor');
  var $state = require('$state');
  var closeState = require('navigation/closeState');
  var localeList = require('data/localeList').create($scope.spaceLocales);
  var notify = require('LocaleEditor/notifications');

  var formWasDirty = false;
  var persistedLocaleCode = null;

  $scope.locales = localeList.prepareLocaleList($scope.locale);
  onLoadOrUpdate();

  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

  $scope.$watch('localeForm.$dirty', function (modified) {
    $scope.context.dirty = modified;
  });

  $scope.$watch('locale.code', function (code) {
    $scope.context.title = prepareTitle();
    clearFallbackIfTheSame(code);
    $scope.fallbackLocales = localeList.prepareFallbackList(code);
  });

  function onLoadOrUpdate () {
    var code = $scope.locale.code;
    persistedLocaleCode = code;
    $scope.hasDependantLocales = localeList.hasDependantLocales(code);
  }

  function prepareTitle () {
    var name = getLocaleName();
    var empty = $scope.locale.sys.id ? 'Unnamed locale' : 'New locale';
    return name || empty;
  }

  function getLocaleName () {
    var code = $scope.locale.code;
    var locale = findLocale(code);
    return locale && locale.name;
  }

  function findLocale (code) {
    return _.find($scope.locales, {code: code});
  }

  // sometimes a code is selected as a fallback code, but then
  // the same code is selected as the code of the locale;
  // in this situation we clear the fallback code;
  // it cannot happen in the opposite direction (list is filtered)
  function clearFallbackIfTheSame (code) {
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
    available: function () {
      return !$scope.context.isNew &&
             $scope.locale.sys.id &&
             !$scope.locale.default;
    }
  });

  function startDeleteFlow () {
    lockFormWhileSubmitting();
    return openConfirmationDialog()
    .then(function (result) {
      if (result.confirmed) {
        return maybeOpenFallbackLocaleChangeDialog()
        .then(deleteLocale, resetFormStatusOnFailure);
      } else {
        return resetFormStatusOnFailure();
      }
    });
  }

  function openConfirmationDialog () {
    return modalDialog.openConfirmDialog({
      template: 'locale_removal_confirm_dialog',
      scopeData: {locale: $scope.locale}
    });
  }

  function maybeOpenFallbackLocaleChangeDialog () {
    if (localeList.hasDependantLocales($scope.locale.code)) {
      return openFallbackLocaleChangeDialog();
    } else {
      return $q.resolve();
    }
  }

  function openFallbackLocaleChangeDialog () {
    var code = $scope.locale.code;
    var dependantLocales = localeList.getDependantLocales(code);

    return modalDialog.open({
      template: 'choose_new_fallback_dialog',
      scopeData: {
        locale: $scope.locale,
        model: {newFallbackCode: null},
        dependantLocaleNames: prepareDependantLocaleNames(dependantLocales),
        availableLocales: localeList.getAvailableFallbackLocales(code)
      }
    }).promise.then(function (newFallbackCode) {
      var updates = _.map(dependantLocales, fallbackUpdater(newFallbackCode));
      return $q.all(updates).catch(function () {
        notify.codeChangeError();
        return $q.reject();
      });
    });
  }

  function prepareDependantLocaleNames (dependantLocales) {
    if (dependantLocales.length > 4) {
      var rest = ' and ' + (dependantLocales.length - 3) + ' other locales';
      return _.map(dependantLocales.slice(0, 3), 'name').join(', ') + rest;
    } else {
      return _.map(dependantLocales, 'name').join(', ');
    }
  }

  function fallbackUpdater (newFallbackCode) {
    return function (locale) {
      var localeToUpdate = _.find($scope.spaceLocales, {code: locale.code});
      if (localeToUpdate) {
        var data = _.cloneDeep(localeToUpdate);
        data.fallbackCode = newFallbackCode;
        return spaceContext.localeRepo.save(data);
      } else {
        return $q.resolve();
      }
    };
  }

  function deleteLocale () {
    var sys = $scope.locale.sys;
    return spaceContext.localeRepo.remove(sys.id, sys.version)
    .then(function deletedSuccesfully () {
      return TheLocaleStore.refresh()
      .then(function () {
        return closeState();
      })
      .finally(notify.deleteSuccess);
    }, function errorDeletingLocale (err) {
      resetFormStatusOnFailure();
      notify.deleteError(err);
    });
  }


  /**
   * @ngdoc property
   * @name LocaleEditorController#cancel
   * @type {Command}
   */
  controller.cancel = Command.create(function cancel () {
    return $state.go('^.list');
  }, {
    available: function () {
      return $scope.context.isNew;
    }
  });


  /**
   * @ngdoc property
   * @name LocaleEditorController#save
   * @type {Command}
   */
  controller.save = Command.create(save, {
    disabled: function () {
      var form = $scope.localeForm;
      return form.$invalid || !form.$dirty || !$scope.locale.code;
    }
  });

  function save () {
    if ($scope.hasDependantLocales && wasLocaleCodeChanged()) {
      notify.notRenameable();
      return $q.reject();
    }

    $scope.locale.name = getLocaleName();
    lockFormWhileSubmitting();
    return confirmCodeChange()
    .then(function (result) {
      if (result.confirmed) {
        return spaceContext.localeRepo.save($scope.locale)
        .then(saveSuccessHandler)
        .catch(saveErrorHandler);
      } else {
        return resetFormStatusOnFailure();
      }
    });
  }

  function saveSuccessHandler (locale) {
    $scope.locale = locale;
    $scope.localeForm.$setPristine();
    $scope.context.dirty = false;
    return TheLocaleStore.refresh()
    .then(function () {
      onLoadOrUpdate();
      notify.saveSuccess();
      if ($scope.context.isNew) {
        return $state.go('spaces.detail.settings.locales.detail', {
          localeId: $scope.locale.sys.id
        });
      }
    });
  }

  function saveErrorHandler (err) {
    notify.saveError(err);
    resetFormStatusOnFailure();
  }

  function confirmCodeChange () {
    if (wasLocaleCodeChanged()) {
      return modalDialog.openConfirmDialog({
        template: 'locale_code_change_confirm_dialog',
        scopeData: {
          locale: $scope.locale,
          persistedLocaleName: findLocale(persistedLocaleCode).name,
          persistedLocaleCode: persistedLocaleCode
        }
      });
    } else {
      return $q.resolve({confirmed: true});
    }
  }

  function wasLocaleCodeChanged () {
    return persistedLocaleCode && persistedLocaleCode !== $scope.locale.code;
  }

  function lockFormWhileSubmitting () {
    formWasDirty = $scope.localeForm.$dirty;
    $scope.localeForm.$setSubmitted();
  }

  function resetFormStatusOnFailure () {
    $scope.localeForm.$setPristine();
    if (formWasDirty) {
      $scope.localeForm.$setDirty();
    }
  }
}])

.factory('LocaleEditor/notifications', ['require', function (require) {
  var notification = require('notification');
  var logger = require('logger');

  var NOT_RENAMEABLE_MESSAGE = 'Cannot change the code of a locale which is fallback of another one';
  var ERROR_CHECKS = [
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
      check: function (err) {
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

  function deleteSuccess () {
    notification.info('Locale deleted successfully');
  }

  function saveSuccess () {
    notification.info('Locale saved successfully');
  }

  function notRenameable () {
    notification.error(NOT_RENAMEABLE_MESSAGE);
  }

  function codeChangeError () {
    notification.error('New fallback code could not be saved');
  }

  function deleteError (err) {
    notification.error('Locale could not be deleted: ' + err.body.message);
    logger.logServerWarn('Locale could not be deleted', {error: err});
  }

  function saveError (err) {
    var message = getErrorMessage(err);
    if (message) {
      notification.error('Locale could not be saved: ' + message);
    } else {
      notification.error('Locale could not be saved');
      logger.logServerWarn('Locale could not be saved', {error: err});
    }
  }

  function getErrorMessage (err) {
    var found = _.find(ERROR_CHECKS, function (item) {
      return item.check(err);
    });

    return found && found.message;
  }

  function checkUnprocessableEntityErrorName (name, err) {
    var status = _.get(err, 'statusCode');
    var errors = _.get(err, 'body.details.errors');

    return status === 422 && errors && errors.length > 0 && errors[0].name === name;
  }
}]);
