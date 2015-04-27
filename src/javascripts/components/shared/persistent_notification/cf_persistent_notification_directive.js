'use strict';

angular.module('contentful').directive('cfPersistentNotification', ['$sce', 'throttle', 'analytics', function ($sce, throttle, analytics) {
  return {
    restrict: 'E',
    replace: true,
    template: JST.cf_persistent_notification(),
    link: function (scope) {
      var persistentNotificationDismissed;
      scope.message = null;
      scope.actionMessage = null;

      scope.dismissPersistentNotification = function () {
        analytics.track('Clicked Top Banner Close Button');
        persistentNotificationDismissed = true;
        resetNotification();
      };

      function updateNotification(ev, params) {
        if(!params || persistentNotificationDismissed){
          resetNotification();
          return;
        }
        scope.persistentNotification = true;
        _.each(params, function (val, key) {
          if(key === 'message') scope[key] = $sce.trustAsHtml(val);
          else scope[key] = val;
        });
      }

      function resetNotification() {
        scope.message = null;
        scope.actionMessage = null;
        scope.persistentNotification = null;
      }

      scope.$on('persistentNotification', throttle(updateNotification, 2500));
    }
  };
}]);
