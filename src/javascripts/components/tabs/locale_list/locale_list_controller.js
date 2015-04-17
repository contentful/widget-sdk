'use strict';

angular.module('contentful').
controller('LocaleListController', ['$scope', '$injector', function ($scope, $injector) {
  var ReloadNotification = $injector.get('ReloadNotification');

  $scope.refreshLocales = function () {
    return $scope.spaceContext.space.getLocales()
    .then(function (locales) {
      $scope.locales = locales;
    })
    .catch(ReloadNotification.apiErrorHandler);
  };

  $scope.getEnabledInfo = function (locale) {
    var info1 = locale.data.contentDeliveryApi   ? 'Publishing' : '';
    var info2 = locale.data.contentManagementApi ? 'Editing'    : '';

    if (info1 && info2) {
      return info1 + ' and ' + info2.toLowerCase();
    } else if (info1 || info2) {
      return info1 + info2 + ' only';
    } else {
      return '-';
    }
  };

  $scope.refreshLocales();
}]);
