'use strict';

angular.module('contentful')

.directive('cfAccountView', ['$injector', function ($injector) {

  var $timeout = $injector.get('$timeout');
  var $stateParams = $injector.get('$stateParams');
  var $location = $injector.get('$location');
  var authentication = $injector.get('authentication');
  var modalDialog = $injector.get('modalDialog');
  var createChannel = $injector.get('iframeChannel').create;
  var handleGK = $injector.get('handleGatekeeperMessage');

  return {
    template: '<div class="account-container"><iframe width="100%" height="100%" id="accountViewFrame" /></div>',
    restrict: 'E',
    link: function (scope, elem) {
      var iframe = elem.find('iframe');
      var channel = createChannel(iframe);
      var timeout = null;

      channel.onMessage(handleGK);
      channel.onMessage(function () { scope.context.ready = true; });
      iframe.ready(waitAndForceLogin);
      iframe.prop('src', authentication.accountUrl() + '/' + $stateParams.pathSuffix);
      scope.$on('$destroy', function () {
        channel.off();
        cancelTimeout();
      });

      function waitAndForceLogin () {
        timeout = $timeout(function () {
          if (!dotty.get(scope, 'context.ready')) { forceLogin(); }
          timeout = null;
        }, 5000);
      }

      function cancelTimeout () {
        if (timeout) {
          $timeout.cancel(timeout);
          timeout = null;
        }
      }
    }
  };

  function forceLogin () {
    modalDialog.open({
      title: 'We need to check your credentials',
      message: 'Before continuing to account settings we need to verify your identity.',
      confirmLabel: 'Go to login form',
      cancelLabel: 'Cancel',
      backgroundClose: false,
      disableTopCloseButton: true,
      ignoreEsc: true,
      attachTo: 'body'
    }).promise.then(function () {
      authentication.clearAndLogin();
    }, function () {
      $location.url('/');
    });
  }
}]);
