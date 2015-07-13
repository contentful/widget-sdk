'use strict';

angular.module('contentful')

.controller('LocaleListController', ['$scope', '$injector', function ($scope, $injector) {
  var ReloadNotification = $injector.get('ReloadNotification');

  $scope.refreshLocales = refreshLocales;
  $scope.getEnabledInfo = getEnabledInfo;

  $scope.refreshLocales();

  function refreshLocales() {
    return $scope.spaceContext.space.getLocales()
    .then(function (locales) {
      $scope.locales = locales;
    })
    .catch(ReloadNotification.apiErrorHandler);
  }

  function getEnabledInfo (locale) {
    var info1 = locale.data.contentDeliveryApi   ? 'Publishing' : '';
    var info2 = locale.data.contentManagementApi ? 'Editing'    : '';

    if (info1 && info2) {
      return info1 + ' and ' + info2.toLowerCase();
    } else if (info1 || info2) {
      return info1 + info2 + ' only';
    } else {
      return '-';
    }
  }

}])

.directive('cfLocaleList', function() {
  return {
    template: JST.locale_list(),
    restrict: 'A',
    controller: 'LocaleListController'
  };
});
