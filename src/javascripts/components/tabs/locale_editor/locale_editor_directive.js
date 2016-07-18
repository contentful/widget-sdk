'use strict';

angular.module('contentful')

.directive('cfLocaleEditor', function () {
  return {
    template: JST.locale_editor(),
    restrict: 'E',
    controller: 'LocaleEditorController',
    controllerAs: 'localeEditor'
  };
})

/**
 * @ngdoc type
 * @name LocaleEditorController
 *
 * @scope.requires  context
 * @scope.requires  locale
 * @scope.requires  localeForm
 *
 * @scope.provides  locales
*/
.controller('LocaleEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var controller       = this;
  var localesList      = $injector.get('localesList');
  var TheLocaleStore   = $injector.get('TheLocaleStore');
  var notification     = $injector.get('notification');
  var logger           = $injector.get('logger');
  var $q               = $injector.get('$q');
  var modalDialog      = $injector.get('modalDialog');
  var tokenStore       = $injector.get('tokenStore');
  var analytics        = $injector.get('analytics');
  var Command          = $injector.get('command');
  var leaveConfirmator = $injector.get('navigation/confirmLeaveEditor');
  var $state           = $injector.get('$state');
  var spaceContext     = $injector.get('spaceContext');
  var closeState       = $injector.get('navigation/closeState');

  var formWasDirty = false;

  $scope.locales = _.clone(localesList, true);
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
    prepareFallbackList(code);
  });

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

  function startDeleteFlow() {
    lockFormWhileSubmitting();
    return modalDialog.openConfirmDialog({
      template: 'locale_removal_confirm_dialog',
      scope: $scope
    })
    .then(function (result) {
      if(result.confirmed)
        return deleteLocale();
      else
        return resetFormStatusOnFailure();
    });
  }

  function deleteLocale() {
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
      notification.warn('Locale could not be deleted: ' + err.body.message);
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

  function save() {
    lockFormWhileSubmitting();
    return confirmCodeChange()
    .then(function (result) {
      if(result.confirmed) {
        return $scope.locale.save()
        .then(saveSuccessHandler)
        .catch(saveErrorHandler);
      } else {
        return resetFormStatusOnFailure();
      }
    });
  }

  function saveSuccessHandler(response) {
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

  function saveErrorHandler(err) {
    resetFormStatusOnFailure();
    var message = '';
    var status = dotty.get(err, 'statusCode');
    var errors = dotty.get(err, 'body.details.errors');

    var isTaken = status === 422 && errors && errors.length > 0 && errors[0].name === 'taken';
    var isNotRenameable = status === 403 && dotty.get(err, 'body.sys.id') === 'FallbackLocaleNotRenameable';

    if (isTaken) {
      message = ': This locale already exists.';
    } else if (isNotRenameable) {
      message = ': Cannot change the code of a locale which is fallback of another one';
    } else {
      logger.logServerWarn('Locale could not be saved', {error: err});
    }

    notification.warn('Locale could not be saved' + message);
    trackSave('Saved Errored Locale');
  }

  function confirmCodeChange() {
    if($scope.initialLocaleCode && $scope.initialLocaleCode !== $scope.locale.data.code){
      return modalDialog.openConfirmDialog({
        template: 'locale_code_change_confirm_dialog',
        scope: $scope
      });
    }
    return $q.resolve({confirmed: true});
  }

  function findLocaleByCode(code) {
    return _.find($scope.locales, function (item) {
      return item.code === code;
    });
  }

  function lockFormWhileSubmitting() {
    formWasDirty = $scope.localeForm.$dirty;
    $scope.localeForm.$setSubmitted();
  }

  function resetFormStatusOnFailure() {
    $scope.localeForm.$setPristine();
    if(formWasDirty) $scope.localeForm.$setDirty();
  }

  function updateLocaleName(code) {
    if (code) {
      var locale = findLocaleByCode(code);
      if(locale) {
        $scope.locale.data.name = locale.name;
      }
    }
  }

  function prepareFallbackList (code) {
    if (code && $scope.locale.data.fallbackCode === code) {
      $scope.locale.data.fallbackCode = null;
    }

    var spaceLocaleCodes = _.map($scope.spaceLocales, function (locale) {
      return locale.getCode();
    });

    $scope.fallbackLocales = _.filter(localesList, function (locale) {
      return locale.code !== code && spaceLocaleCodes.indexOf(locale.code) > -1;
    });
  }

  function updateInitialLocaleCode() {
    $scope.initialLocaleCode = $scope.locale.data.code;
  }

  /**
   * Adds the current locale to the list
   *
   * This accounts for user defined locales from before the predefined list of locales existed
  */
  function addCurrentLocaleToList() {
    if (!findLocaleByCode($scope.locale.getCode()) && !!$scope.locale.getId()) {
      $scope.locales.push({
        code: $scope.locale.getCode(),
        name: $scope.locale.getName()
      });
    }
  }

  function trackSave(message) {
    var locale = $scope.locale;
    analytics.track(message, {
      subscriptionPlan: getSubscriptionPlanName(),
      locale:         locale.getName(),
      saveFrequency:    locale.getVersion() ? 'return save' : 'first time save',
      editing:          getEnabledState(locale.data.contentManagementApi),
      publishing:       getEnabledState(locale.data.contentDeliveryApi),
      defaultLocale:    getEnabledState(locale.isDefault())
    });
  }

  function getEnabledState(state) {
    return state ? 'return save' : 'first time save';
  }

  function trackDelete() {
    analytics.track('Clicked Delete Locale Button', {
      subscriptionPlan: getSubscriptionPlanName(),
      locale: $scope.locale.getName()
    });
  }

  function getSubscriptionPlanName() {
    return spaceContext.space.data.organization.subscriptionPlan.name;
  }

}]);
