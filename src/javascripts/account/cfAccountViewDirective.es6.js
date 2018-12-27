import { registerDirective } from 'NgRegistry.es6';
import _ from 'lodash';
import { h } from 'utils/legacy-html-hyperscript/index.es6';
import * as K from 'utils/kefir.es6';

registerDirective('cfAccountView', [
  '$timeout',
  'modalDialog',
  'handleGatekeeperMessage',
  'Authentication.es6',
  'account/UrlSyncHelper.es6',
  'account/IframeChannel.es6',
  ($timeout, modalDialog, handleGK, Authentication, UrlSyncHelper, { default: createChannel }) => {
    return {
      template: template(),
      restrict: 'E',
      scope: {
        context: '=',
        hideHeader: '='
      },
      link: function(scope, elem) {
        const iframe = elem.find('iframe');
        const messages$ = createChannel(iframe.get(0));
        let timeout = null;

        K.onValueScope(scope, messages$, handleGK);
        K.onValueScope(scope, messages$, closeModalsIfLocationUpdated);

        iframe.ready(waitAndForceLogin);
        iframe.prop('src', UrlSyncHelper.getGatekeeperUrl());
        scope.$on('$destroy', cancelTimeout);

        function waitAndForceLogin() {
          timeout = $timeout(() => {
            if (!_.get(scope, 'context.ready')) {
              forceLogin();
            }
            timeout = null;
          }, 5000);
        }

        function cancelTimeout() {
          if (timeout) {
            $timeout.cancel(timeout);
            timeout = null;
          }
        }

        // the force login dialog gets shown if the GK view loads too slowly
        // we should close it if the page is later loaded successfully
        function closeModalsIfLocationUpdated(message) {
          scope.context.ready = true;
          if (message.action === 'update' && message.type === 'location') {
            modalDialog.closeAll();
          }
          cancelTimeout();
        }
      }
    };

    function template() {
      return h(
        'div',
        {
          style: {
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            background: 'white'
          },
          ngStyle: "{top: hideHeader ? '0' : '70px'}"
        },
        [h('iframe', { width: '100%', height: '100%', id: 'accountViewFrame' })]
      );
    }

    function forceLogin() {
      modalDialog
        .open({
          title: 'We need to check your credentials',
          message: 'Before continuing to account settings we need to verify your identity.',
          confirmLabel: 'Go to login form',
          cancelLabel: 'Cancel',
          backgroundClose: false,
          disableTopCloseButton: true,
          ignoreEsc: true,
          attachTo: 'body'
        })
        .promise.then(() => {
          Authentication.redirectToLogin();
        });
    }
  }
]);
