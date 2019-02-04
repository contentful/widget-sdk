import { registerFactory } from 'NgRegistry.es6';
import _ from 'lodash';
import * as CallBuffer from 'utils/CallBuffer.es6';

export default function register() {
  /**
   * @ngdoc service
   * @name bugsnag
   * @description
   * Bugsnag wrapper.
   * See https://bugsnag.com/docs/notifiers/js for more details
   */
  registerFactory('bugsnag', [
    '$injector',
    'environment',
    ($injector, environment) => {
      // TODO this should be stored in the environment configuration. Need
      // to work with devops get this done.
      const API_KEY = 'b253f10d5d0184a99e1773cec7b726e8';

      let bugsnag;
      const callBuffer = CallBuffer.create();
      const loadOnce = _.once(load);

      return {
        /**
         * @ngdoc method
         * @name bugsnag#enable
         * @description
         * Loads bugsnag and sets the user information. Resolves the promise when
         * bugsnag has loaded.
         *
         * It will not reload bugsnag and set the user data if called multiple
         * times.
         *
         * @param {API.User} user
         * @returns {Promise<void>}
         */
        enable: function(user) {
          return loadOnce(user);
        },

        disable: function() {
          callBuffer.disable();
        },

        notify: function() {
          const args = arguments;
          callBuffer.call(() => {
            if (bugsnag) bugsnag.notify(...args);
          });
        },

        notifyException: function() {
          const args = arguments;
          callBuffer.call(() => {
            if (bugsnag) bugsnag.notifyException(...args);
          });
        },

        refresh: function() {
          if (bugsnag) bugsnag.refresh();
        },

        /**
         * @ngdoc method
         * @name bugsnag#leaveBreadcrumb
         * @description
         * Records an event.
         *
         * The event trail is shown on bugsnag when an error occured.
         *
         * Note that the data object should only be one level deep and the
         * object’s values are limited to 140 characters each.
         *
         * https://docs.bugsnag.com/platforms/browsers/#leaving-breadcrumbs
         *
         * @param {string} name
         * @param {object} data
         */
        leaveBreadcrumb: function(name, data) {
          callBuffer.call(() => {
            if (bugsnag) bugsnag.leaveBreadcrumb(name, data);
          });
        }
      };

      function load(user) {
        // Prevent circular dependency
        const LazyLoader = $injector.get('LazyLoader');

        return LazyLoader.get('bugsnag').then(
          _bugsnag => {
            bugsnag = _bugsnag;
            // Do not patch `console.log`. It messes up stack traces
            bugsnag.disableAutoBreadcrumbsConsole();
            bugsnag.enableNotifyUnhandledRejections();
            bugsnag.apiKey = API_KEY;
            bugsnag.notifyReleaseStages = ['staging', 'production'];
            bugsnag.releaseStage = environment.env;
            bugsnag.appVersion = environment.gitRevision;
            setUserInfo(user, bugsnag);
            callBuffer.resolve();
          },
          () => {
            callBuffer.disable();
          }
        );
      }

      function setUserInfo(user, bugsnag) {
        const userId = _.get(user, ['sys', 'id']);
        if (userId) {
          bugsnag.user = {
            id: userId,
            adminLink: getAdminLink(user),
            organizations: getOrganizations(user)
          };
        }
      }

      function getOrganizations(user) {
        const organizationMemberships = user.organizationMemberships || [];
        return organizationMemberships.map(membership => membership.organization.sys.id).join(', ');
      }

      function getAdminLink(user) {
        const id = _.get(user, ['sys', 'id']);
        return 'https://admin.' + environment.settings.main_domain + '/admin/users/' + id;
      }
    }
  ]);
}
