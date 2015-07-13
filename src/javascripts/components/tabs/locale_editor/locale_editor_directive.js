'use strict';

angular.module('contentful')

/**
 * @ngdoc type
 * @name LocaleEditorController
 *
 * @scope.requires  context
 * @scope.requires  $state
 * @scope.requires  spaceContext
 * @scope.requires  locale
 * @scope.requires  localeForm
 *
 * @scope.provides  locales
*/
.controller('LocaleEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var localesList  = $injector.get('localesList');
  var notification = $injector.get('notification');
  var logger       = $injector.get('logger');
  var $q           = $injector.get('$q');
  var modalDialog  = $injector.get('modalDialog');
  var tokenStore   = $injector.get('tokenStore');
  var analytics    = $injector.get('analytics');

  var formWasDirty = false;

  $scope.startDeleteFlow = startDeleteFlow;
  $scope.cancel = cancel;
  $scope.save = save;

  $scope.context.closingMessage = 'You have unsaved changes.';
  $scope.locales = _.clone(localesList, true);
  addCurrentLocaleToList();
  updateInitialLocaleCode();

  $scope.$watch('localeForm.$dirty', function (modified) {
    $scope.context.dirty = modified;
  });

  $scope.$watch('locale.getName()', function (title) {
    $scope.context.title = $scope.locale.getId() ? title : 'New locale';
  });

  $scope.$watch('locale.getCode()', updateLocaleName);

  /*  TODO: Finish when Gatekeeper support for setting as default is done
  $scope.getHumanDefault = function () {
    var defaultLocale = $scope.spaceContext.defaultLocale;

    if (defaultLocale.code === $scope.locale.getCode()) return 'this';

    return defaultLocale.name + ' (' + defaultLocale.code + ')';
  };

  $scope.canSetAsDefault = function () {
    return !!$scope.locale.getId() && !$scope.locale.isDefault();
  };

  $scope.makeDefault = function () {
  };
  */

  /**
   * @ngdoc method
   * @name LocaleEditorController#startDeleteFlow
  */
  function startDeleteFlow() {
    lockFormWhileSubmitting();
    modalDialog.openConfirmDialog({
      template: 'locale_removal_confirm_dialog',
      scope: $scope
    })
    .then(function (result) {
      if(result.confirmed)
        deleteLocale();
      else
        resetFormStatusOnFailure();
    });
  }

  function deleteLocale() {
    trackDelete();
    $scope.locale.delete()
    .then(function () {
      notification.info('Locale deleted successfully');
      tokenStore.getUpdatedToken().then(function () {
        $scope.context.dirty = false;
        $scope.closeState();
      });
    })
    .catch(function (err) {
      resetFormStatusOnFailure();
      notification.warn('Locale could not be deleted: ' + err.body.message);
      logger.logServerWarn('Locale could not be deleted', {error: err});
    });
  }

  /**
   * @ngdoc method
   * @name LocaleEditorController#cancel
  */
  function cancel() {
    $scope.$state.go('^.list');
  }

  function updateInitialLocaleCode() {
    $scope.initialLocaleCode = $scope.locale.data.code;
  }

  /**
   * @ngdoc method
   * @name LocaleEditorController#save
  */
  function save() {
    lockFormWhileSubmitting();
    confirmCodeChange()
    .then(function (result) {
      if(result.confirmed) {
        return $scope.locale.save()
        .then(saveSuccessHandler)
        .catch(saveErrorHandler);
      }
      resetFormStatusOnFailure();
    });
  }

  function saveSuccessHandler(response) {
    $scope.localeForm.$setPristine();
    $scope.context.dirty = false;
    tokenStore.getUpdatedToken().then(function () {
      updateInitialLocaleCode();
      $scope.$state.go('spaces.detail.settings.locales.detail', { localeId: response.getId() });
      $scope.spaceContext.refreshLocales();
      notification.info('Locale saved successfully');
      trackSave('Saved Successful Locale');
    });
  }

  function saveErrorHandler(err) {
    resetFormStatusOnFailure();
    var message = '';
    var errors = dotty.get(err, 'body.details.errors');

    if (dotty.get(err, 'statusCode') !== 422) {
      logger.logServerWarn('Locale could not be saved', {error: err});
    } else if (errors && errors.length > 0 && errors[0].name === 'taken') {
      message = ': This locale already exists.';
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
    return $q.when({confirmed: true});
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
    return $scope.spaceContext.space.data.organization.subscriptionPlan.name;
  }

}])

.directive('cfLocaleEditor', function () {
  return {
    template: JST.locale_editor(),
    restrict: 'A',
    controller: 'LocaleEditorController'
  };
});
