'use strict';

angular.module('contentful')
.directive('cfAccountView', ['require', function (require) {

  var $timeout = require('$timeout');
  var $location = require('$location');
  var authentication = require('authentication');
  var modalDialog = require('modalDialog');
  var createChannel = require('account/IframeChannel').default;
  var K = require('utils/kefir');
  var handleGK = require('handleGatekeeperMessage');
  var Config = require('Config');

  return {
    template: '<div class="account-container"><iframe width="100%" height="100%" id="accountViewFrame" /></div>',
    restrict: 'E',
    link: function (scope, elem) {
      var iframe = elem.find('iframe');
      var messages$ = createChannel(iframe.get(0));
      var timeout = null;

      var gkPathSuffix = getGkPathSuffix($location.path());

      K.onValueScope(scope, messages$, handleGK);
      K.onValueScope(scope, messages$, closeModalsIfLocationUpdated);

      iframe.ready(waitAndForceLogin);
      iframe.prop('src', Config.accountUrl(gkPathSuffix));
      scope.$on('$destroy', cancelTimeout);

      // remove leading /account and add trailing slash
      function getGkPathSuffix (path) {
        return (_.endsWith(path, '/') ? path : path + '/').replace(/^\/account/, '');
      }

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

      // the force login dialog gets shown if the GK view loads too slowly
      // we should close it if the page is later loaded successfully
      function closeModalsIfLocationUpdated (message) {
        scope.context.ready = true;
        if (message.action === 'update' && message.type === 'location') {
          modalDialog.closeAll();
        }
        cancelTimeout();
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
    });
  }
}]);
