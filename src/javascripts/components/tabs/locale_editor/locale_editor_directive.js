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
 *
 *
 * TODO
 * - add persistence layer (repo)
 * - do not use @contetnful/client objects
 * - do not expose the locale instance on the scope
 * - simplify relation with TokenStore
*/
.controller('LocaleEditorController', ['$scope', 'require', function ($scope, require) {

  var controller = this;
  var TheLocaleStore = require('TheLocaleStore');
  var notification = require('notification');
  var logger = require('logger');
  var $q = require('$q');
  var modalDialog = require('modalDialog');
  var tokenStore = require('tokenStore');
  var analytics = require('analytics');
  var Command = require('command');
  var leaveConfirmator = require('navigation/confirmLeaveEditor');
  var $state = require('$state');
  var spaceContext = require('spaceContext');
  var closeState = require('navigation/closeState');
  var localeList = require('data/localeList').fromClientResponse($scope.spaceLocales);

  var NOT_RENAMEABLE_MESSAGE = 'Cannot change the code of a locale which is fallback of another one';

  var formWasDirty = false;
  var persistedLocaleCode = null;

  $scope.locales = localeList.prepareLocaleList($scope.locale.data);
  onLoadOrUpdate();

  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

  $scope.$watch('localeForm.$dirty', function (modified) {
    $scope.context.dirty = modified;
  });

  $scope.$watch('locale.data.code', function (code) {
    $scope.context.title = prepareTitle();
    clearFallbackIfTheSame(code);
    $scope.fallbackLocales = localeList.prepareFallbackList(code);
  });

  function onLoadOrUpdate () {
    var code = $scope.locale.data.code;
    persistedLocaleCode = code;
    $scope.hasDependantLocales = localeList.hasDependantLocales(code);
  }

  function prepareTitle () {
    var name = getLocaleName();
    var empty = $scope.locale.getId() ? 'Unnamed locale' : 'New locale';
    return name || empty;
  }

  function getLocaleName () {
    var code = $scope.locale.data.code;
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
    if (code && $scope.locale.data.fallbackCode === code) {
      $scope.locale.data.fallbackCode = null;
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
             $scope.locale.getId() &&
             !$scope.locale.data.default;
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
    if (localeList.hasDependantLocales($scope.locale.data.code)) {
      return openFallbackLocaleChangeDialog();
    } else {
      return $q.resolve();
    }
  }

  function openFallbackLocaleChangeDialog () {
    var code = $scope.locale.data.code;
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
        notification.error('New fallback code could not be saved');
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
      locale = _.find($scope.spaceLocales, {data: {code: locale.code}});
      if (locale) {
        locale.data.fallbackCode = newFallbackCode;
        return locale.save();
      } else {
        return $q.resolve();
      }
    };
  }

  function deleteLocale () {
    trackDelete();
    return $scope.locale.delete()
    .then(function deletedSuccesfully () {
      return tokenStore.refresh().then(function () {
        // TODO Should probably be handled by the token store
        TheLocaleStore.refresh();
        return closeState();
      }).finally(function () {
        notification.info('Locale deleted successfully');
      });
    }, function errorDeletingLocale (err) {
      resetFormStatusOnFailure();
      notification.error('Locale could not be deleted: ' + err.body.message);
      logger.logServerWarn('Locale could not be deleted', {error: err});
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
      return form.$invalid || !form.$dirty || !$scope.locale.data.code;
    }
  });

  function save () {
    if ($scope.hasDependantLocales && wasLocaleCodeChanged()) {
      notification.error(NOT_RENAMEABLE_MESSAGE);
      return $q.reject();
    }

    $scope.locale.data.name = getLocaleName();
    lockFormWhileSubmitting();
    return confirmCodeChange()
    .then(function (result) {
      if (result.confirmed) {
        return $scope.locale.save()
        .then(saveSuccessHandler)
        .catch(saveErrorHandler);
      } else {
        return resetFormStatusOnFailure();
      }
    });
  }

  function saveSuccessHandler (response) {
    $scope.localeForm.$setPristine();
    $scope.context.dirty = false;
    return tokenStore.refresh().then(function () {
      onLoadOrUpdate();
      // TODO Should probably be handled by the token store
      TheLocaleStore.refresh();
      notification.info('Locale saved successfully');
      trackSave('Saved Successful Locale');
      if ($scope.context.isNew) {
        return $state.go('spaces.detail.settings.locales.detail', { localeId: response.getId() });
      }
    });
  }

  function saveErrorHandler (err) {
    resetFormStatusOnFailure();
    var message = '';
    var status = dotty.get(err, 'statusCode');
    var errors = dotty.get(err, 'body.details.errors');

    var isTaken = status === 422 && errors && errors.length > 0 && errors[0].name === 'taken';
    var isNotRenameable = status === 403 && dotty.get(err, 'body.sys.id') === 'FallbackLocaleNotRenameable';

    if (isTaken) {
      message = ': This locale already exists';
    } else if (isNotRenameable) {
      message = ': ' + NOT_RENAMEABLE_MESSAGE;
    } else {
      logger.logServerWarn('Locale could not be saved', {error: err});
    }

    notification.error('Locale could not be saved' + message);
    trackSave('Saved Errored Locale');
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
    return persistedLocaleCode && persistedLocaleCode !== $scope.locale.data.code;
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

  function trackSave (message) {
    var locale = $scope.locale;
    analytics.track(message, {
      subscriptionPlan: getSubscriptionPlanName(),
      locale: locale.getName(),
      saveFrequency: locale.getVersion() ? 'return save' : 'first time save',
      editing: getEnabledState(locale.data.contentManagementApi),
      publishing: getEnabledState(locale.data.contentDeliveryApi),
      defaultLocale: getEnabledState(locale.isDefault())
    });
  }

  function getEnabledState (state) {
    return state ? 'return save' : 'first time save';
  }

  function trackDelete () {
    analytics.track('Clicked Delete Locale Button', {
      subscriptionPlan: getSubscriptionPlanName(),
      locale: $scope.locale.getName()
    });
  }

  function getSubscriptionPlanName () {
    return spaceContext.getData('organization.subscriptionPlan.name');
  }
}]);
