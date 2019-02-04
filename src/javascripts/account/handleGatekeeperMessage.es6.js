import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import { Notification } from '@contentful/forma-36-react-components';

export default function register() {
  registerFactory('handleGatekeeperMessage', [
    '$location',
    '$state',
    'modalDialog',
    'Authentication.es6',
    'services/TokenStore.es6',
    'services/CreateSpace.es6',
    'analytics/Analytics.es6',
    'account/UrlSyncHelper.es6',
    (
      $location,
      $state,
      modalDialog,
      Authentication,
      TokenStore,
      CreateSpace,
      analytics,
      UrlSyncHelper
    ) => {
      return function handleGatekeeperMessage(data) {
        const match = makeMessageMatcher(data);

        if (match('create', 'UserCancellation')) {
          Authentication.cancelUser();
        } else if (match('new', 'space')) {
          CreateSpace.showDialog(data.organizationId);
        } else if (match('delete', 'space')) {
          TokenStore.refresh();
        } else if (data.type === 'analytics') {
          trackGKEvent(data);
        } else if (data.type === 'flash') {
          showNotification(data);
        } else if (match('navigate', 'location')) {
          $location.url(data.path);
        } else if (match('update', 'location')) {
          UrlSyncHelper.updateWebappUrl(data.path);
        } else if (matchesError(data, 401)) {
          Authentication.redirectToLogin();
        } else if (matchesError(data)) {
          showErrorModal(data);
        } else {
          TokenStore.refresh();
        }
      };

      function matchesError(data, errorCode) {
        if (data.type !== 'error') {
          return false;
        }

        if (errorCode) {
          return data.status === errorCode;
        } else {
          return /^(4|5)[0-9]{2}$/.test(data.status);
        }
      }

      function makeMessageMatcher(data) {
        return function matchMessage(action, type) {
          const messageAction = _.get(data, 'action', '').toLowerCase();
          const messageType = _.get(data, 'type', '').toLowerCase();

          return action.toLowerCase() === messageAction && type.toLowerCase() === messageType;
        };
      }

      function showErrorModal(data) {
        const defaultTitle = 'Something went wrong';
        const defaultMessage =
          'An error has occurred. We have been automatically notified and will investigate. If it re-occurs, please contact support.';

        modalDialog
          .open({
            title: _.unescape(data.heading) || defaultTitle,
            message: _.unescape(data.body) || defaultMessage,
            ignoreEsc: true,
            backgroundClose: false
          })
          .promise.then(() => {
            $state.go('home');
          });
      }

      function showNotification(data) {
        const level = _.get(data, 'resource.type', 'info');
        const message = _.get(data, 'resource.message');

        if (!level) {
          return;
        }

        if (message) {
          if (level.match(/error/)) {
            Notification.error(message);
          } else {
            Notification.success(message);
          }
        }
      }

      function trackGKEvent({ event, data: eventData }) {
        if (event && eventData) {
          const newData = Object.assign({}, eventData);

          if (newData.fromState === '$state.current.name') {
            newData.fromState = $state.current.name;
          }

          analytics.track(event, newData);
        }
      }
    }
  ]);
}
