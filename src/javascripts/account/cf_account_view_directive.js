'use strict';

angular.module('contentful')
.directive('cfAccountView', ['require', function (require) {

  var h = require('utils/hyperscript').h;
  var $timeout = require('$timeout');
  var authentication = require('Authentication');
  var modalDialog = require('modalDialog');
  var createChannel = require('account/IframeChannel').default;
  var K = require('utils/kefir');
  var handleGK = require('handleGatekeeperMessage');
  var UrlSyncHelper = require('account/UrlSyncHelper');

  return {
    template: template(),
    restrict: 'E',
    scope: {
      context: '='
    },
    link: function (scope, elem) {
      var iframe = elem.find('iframe');
      var messages$ = createChannel(iframe.get(0));
      var timeout = null;

      K.onValueScope(scope, messages$, handleGK);
      K.onValueScope(scope, messages$, closeModalsIfLocationUpdated);

      iframe.ready(waitAndForceLogin);
      iframe.prop('src', UrlSyncHelper.getGatekeeperUrl());
      scope.$on('$destroy', cancelTimeout);

      function waitAndForceLogin () {
        timeout = $timeout(function () {
          if (!_.get(scope, 'context.ready')) { forceLogin(); }
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

  function template () {
    return h('div', {
      style: {
        position: 'absolute',
        top: '70px',
        left: 0,
        right: 0,
        bottom: 0,
        background: 'white'
      }
    }, [
      h('iframe', { width: '100%', height: '100%', id: 'accountViewFrame' })
    ]);
  }

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
      authentication.redirectToLogin();
    });
  }
}]);
