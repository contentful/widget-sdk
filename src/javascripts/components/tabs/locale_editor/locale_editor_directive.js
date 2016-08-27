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
  var localesList = require('localesList');
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

  var NOT_RENAMEABLE_MESSAGE = 'Cannot change the code of a locale which is fallback of another one';

  var formWasDirty = false;

  $scope.locales = _.map(localesList, localeToListItem);
  addCurrentLocaleToList();
  updateInitialLocaleCode();

  $scope.context.requestLeaveConfirmation = leaveConfirmator(save);

  $scope.$watch('localeForm.$dirty', function (modified) {
    $scope.context.dirty = modified;
  });

  $scope.$watch('locale.getName()', function (title) {
    $scope.context.title = $scope.locale.getId() ? title : 'New locale';
  });

  $scope.$watch('locale.getCode()', function (code) {
    updateLocaleName(code);
    clearFallbackIfTheSame(code);
    prepareFallbackList(code);
  });

  // sometimes a code is selected as a fallback code, but then
  // the same code is selected as the code of the locale;
  // in this situation we clear the fallback code;
  // it cannot happen in the opposite direction (list is filtered)
  function clearFallbackIfTheSame (code) {
    if (code && $scope.locale.data.fallbackCode === code) {
      $scope.locale.data.fallbackCode = null;
    }
  }

  function prepareFallbackList (code) {
    $scope.fallbackLocales = $scope.spaceLocales
    .filter(canBeFallbackOf(code))
    .map(localeToListItem);
  }

  function canBeFallbackOf (code) {
    return function (locale) {
      return locale.data.contentDeliveryApi && locale.data.code !== code;
    };
  }

  function getDependantLocales (code) {
    return $scope.spaceLocales
    .filter(function (locale) {
      var fallbackCode = locale.data.fallbackCode;
      return fallbackCode && fallbackCode === code;
    });
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
      scope: $scope
    });
  }

  function maybeOpenFallbackLocaleChangeDialog () {
    var dependantLocales = getDependantLocales($scope.locale.data.code);
    var availableLocales = _.filter($scope.spaceLocales, function (locale) {
      var isCurrent = locale.data.code === $scope.locale.data.code;
      var isDependant = dependantLocales.indexOf(locale) > -1;
      return !isCurrent && !isDependant;
    });

    if (dependantLocales.length > 0) {
      return openFallbackLocaleChangeDialog(dependantLocales, availableLocales);
    } else {
      return $q.resolve();
    }
  }

  function openFallbackLocaleChangeDialog (dependantLocales, availableLocales) {
    return modalDialog.open({
      template: 'choose_new_fallback_dialog',
      scopeData: {
        locale: $scope.locale,
        model: {newFallbackCode: null},
        availableLocales: availableLocales,
        dependantLocaleNames: _.map(dependantLocales, function (locale) {
          return locale.data.name + ' (' + locale.data.code + ')';
        }).join(', ')
      }
    }).promise.then(function (newFallbackCode) {
      return $q.all(_.map(dependantLocales, function (locale) {
        locale.data.fallbackCode = newFallbackCode;
        return locale.save();
      }))
      .catch(function () {
        notification.error('New fallback code could not be saved');
        return $q.reject();
      });
    });
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
      return form.$invalid || !form.$dirty;
    }
  });

  function save () {
    if ($scope.hasDependantLocales && wasLocaleCodeChanged()) {
      notification.error(NOT_RENAMEABLE_MESSAGE);
      return $q.reject();
    }

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
      updateInitialLocaleCode();
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
        scope: $scope
      });
    } else {
      return $q.resolve({confirmed: true});
    }
  }

  function wasLocaleCodeChanged () {
    return $scope.initialLocaleCode && $scope.initialLocaleCode !== $scope.locale.data.code;
  }

  function findLocaleByCode (code) {
    return _.find($scope.locales, function (item) {
      return item.code === code;
    });
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

  function updateLocaleName (code) {
    if (code) {
      var locale = findLocaleByCode(code);
      if (locale) {
        $scope.locale.data.name = locale.name;
      }
    }
  }

  function updateInitialLocaleCode () {
    var code = $scope.locale.data.code;
    $scope.initialLocaleCode = code;
    $scope.hasDependantLocales = getDependantLocales(code).length > 0;
  }

  /**
   * Adds the current locale to the list
   *
   * This accounts for user defined locales from before the predefined list of locales existed
  */
  function addCurrentLocaleToList () {
    if (!findLocaleByCode($scope.locale.getCode()) && !!$scope.locale.getId()) {
      $scope.locales.push(localeToListItem($scope.locale));
    }
  }

  function localeToListItem (locale) {
    var code = locale.code || locale.getCode();
    var name = locale.name || locale.getName();

    return {
      code: code,
      name: name,
      label: name + ' (' + code + ')'
    };
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
