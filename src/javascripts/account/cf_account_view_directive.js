'use strict';

angular.module('contentful')

.directive('cfAccountView', ['$injector', function($injector) {

  var $stateParams   = $injector.get('$stateParams');
  var authentication = $injector.get('authentication');
  var createChannel  = $injector.get('iframeChannel').create;
  var handleGK       = $injector.get('handleGatekeeperMessage');

  return {
    template: '<div class="account-container"><iframe width="100%" height="100%" /></div>',
    restrict: 'E',
    link: function (scope, elem) {
      var iframe  = elem.find('iframe');
      var channel = createChannel(iframe);

      channel.onMessage(handleGK);
      channel.onMessage(function () { scope.context.ready = true; });
      scope.$on('$destroy', channel.off);

      iframe.prop('src', authentication.accountUrl() + '/' + $stateParams.pathSuffix);
    }
  };
}]);
