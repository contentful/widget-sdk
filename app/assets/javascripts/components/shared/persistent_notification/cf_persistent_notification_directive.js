angular.module('contentful').directive('cfPersistentNotification', function () {
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
          scope[key] = val;
        });

        if(scope.tooltipMessage){
          elem.tooltip({
            title: scope.tooltipMessage,
            placement: 'left'
          });
        }
      });
    }
  };
});
