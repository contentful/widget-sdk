'use strict';

angular.module('contentful').controller('LocaleEditorController', ['$scope', '$injector', function ($scope, $injector) {
  var availableLocales = $injector.get('locales'),
      notification = $injector.get('notification'),
      logger = $injector.get('logger'),
      tokenStore = $injector.get('tokenStore'),
      analytics = $injector.get('analytics');

  $scope.context.closingMessage = 'You have unsaved changes.';

  /**
   * Let the dropdown show the locales provided by the webapp
   * and the currently applied locale, _if_  the code doesn't already
   * belong in the provided locales.
   */
  function init() {
    $scope.locales = _.clone(availableLocales, true);
    if (!_.find($scope.locales, function (item) {
      return item.code === $scope.locale.getCode();
    }) && !!$scope.locale.getId()) {
      $scope.locales.push({
        code: $scope.locale.getCode(),
        name: $scope.locale.getName()
      });
    }
  }
  init();

  $scope.$watch('localeForm.$dirty', function (modified) {
    $scope.context.dirty = modified;
  });

  $scope.$watch('locale.getName()', function (title) {
    $scope.context.title = $scope.locale.getId() ? title : 'New language';
  });

  $scope.$watch('locale.getCode()', function (code) {
    if (code) {
      $scope.locale.data.name = _.find($scope.locales, function (item) {
        return item.code === code;
      }).name;
    }
  });

  $scope.editable = function () {
    return true;
  };

  function title() {
    return '"' + $scope.locale.getName() + '"';
  }

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
  $scope.delete = function () {
    var t = title();
    $scope.requestInProgress = true;
    trackDelete('Clicked Delete Locale Button');
    $scope.locale.delete()
    .then(function () {
      tokenStore.getUpdatedToken().then(function () {
        notification.info(t + ' deleted successfully');
        $scope.context.dirty = false;
        $scope.closeState();
      });
    })
    .catch(function (err) {
      notification.warn(t + ' could not be deleted: ' + err.body.message);
      logger.logServerWarn('Locale could not be deleted', {error: err});
    })
    .finally(function () { $scope.requestInProgress = false; });
  };

  $scope.save = function () {
    var t = title();
    $scope.requestInProgress = true;
    $scope.locale.save()
    .then(function (response) {
      $scope.localeForm.$setPristine();
      $scope.context.dirty = false;
      tokenStore.getUpdatedToken().then(function () {
        $scope.$state.go('spaces.detail.settings.locales.detail', { localeId: response.getId() });
        notification.info(t + ' saved successfully');
        trackSave('Saved Successful Locale');
      });
    })
    .catch(function (err) {
      var message = '';

      if (dotty.get(err, 'statusCode') !== 422) {
        logger.logServerWarn('Locale could not be saved', {error: err});
      } else {
        if (err.body.details.errors[0].name === 'taken') {
          message = ': This language already exists.';
        }
      }
      notification.warn(t + ' could not be saved' + message);
      trackSave('Saved Errored Locale');
    })
    .finally(function () { $scope.requestInProgress = false; });
  };

  function trackSave(message) {
    analytics.track(message, {
      subscriptionPlan: $scope.spaceContext.space.data.organization.subscriptionPlan.name,
      language: $scope.locale.getName(),
      saveFrequency: $scope.locale.getVersion() ? 'return save' : 'first time save',
      editing: $scope.locale.data.contentManagementApi ? 'enabled' : 'disabled',
      publishing: $scope.locale.data.contentDeliveryApi ? 'enabled' : 'disabled',
      defaultLanguage: $scope.locale.isDefault() ? 'enabled': 'disabled'
    });
  }

  function trackDelete(message) {
    analytics.track(message, {
      subscriptionPlan: $scope.spaceContext.space.data.organization.subscriptionPlan.name,
      language: $scope.locale.getName()
    });
  }
}]);
