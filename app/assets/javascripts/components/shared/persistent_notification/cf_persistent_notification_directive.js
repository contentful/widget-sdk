angular.module('contentful').directive('cfPersistentNotification', function ($sce) {
  'use strict';

  return {
    restrict: 'C',
    template: JST.cf_persistent_notification(),
    link: function (scope, elem) {
      scope.message = null;
      scope.actionMessage = null;

      function updateNotification(ev, params) {
        if(!params){
          scope.persistentNotification = null;
          return;
        }
        scope.persistentNotification = true;
        _.each(params, function (val, key) {
          if(key === 'message') scope[key] = $sce.trustAsHtml(val);
          else scope[key] = val;
        });

        if(scope.tooltipMessage){
          elem.tooltip('destroy');
          elem.tooltip({
            title: scope.tooltipMessage,
            placement: 'bottom',
            container: '.cf-persistent-notification'
          });
        }
      }

      scope.$on('persistentNotification', _.throttle(updateNotification, 2500));
    }
  };
});
