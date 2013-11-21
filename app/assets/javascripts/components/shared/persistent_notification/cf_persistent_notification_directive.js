angular.module('contentful').directive('cfPersistentNotification', function ($sce) {
  'use strict';

  return {
    restrict: 'C',
    template: JST.cf_persistent_notification(),
    link: function (scope, elem) {
      scope.message = null;
      scope.actionMessage = null;

      scope.$watch('persistentNotification', function (params) {
        if(!params) return;
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
      });
    }
  };
});
