'use strict';

/**
 * @ngdoc service
 * @name Subscription
 *
 * @description
 * Represents an organization's subscription.
 */
angular.module('contentful').factory('Subscription', [
  'require',
  require => {
    var moment = require('moment');
    var get = require('lodash').get;

    return {
      /**
       * @ngdoc method
       * @name Subscription#get
       * @param {object} organization
       * @returns {object}
       * @description
       * Creates a Subscription object from given organization data.
       */
      newFromOrganization: newFromOrganization
    };

    function newFromOrganization(org) {
      var trialEndMoment = moment(org.trialPeriodEndsAt);
      var noTrialEndOrInvalid = !org.trialPeriodEndsAt || !trialEndMoment.isValid();

      return {
        /**
         * @ngdoc property
         * @name Subscription#organization.sys
         * @type {object}
         * @description
         * A link to the subscription's organization.
         */
        organization: { sys: buildLink(org) },
        /**
         * @ngdoc method
         * @name Subscription#isLimitedFree
         * @returns {boolean}
         * @description
         * Returns whether the subscription is a “Starter” or “Hacker” plan.
         */
        isLimitedFree: _.constant(get(org, 'subscription.status') === 'free'),
        /**
         * @ngdoc method
         * @name Subscription#isTrial
         * @returns {boolean}
         * @description
         * Returns whether this is a trial subscription.
         */
        isTrial: _.constant(get(org, 'subscription.status') === 'trial'),
        /**
         * @ngdoc method
         * @name Subscription#hasTrialEnded
         * @returns {boolean}
         */
        hasTrialEnded: function() {
          return !this.isTrial() || !trialEndMoment.isAfter(moment());
        },
        /**
         * @ngdoc method
         * @name Subscription#getTrialHoursLeft
         * @returns {integer}
         */
        getTrialHoursLeft: function() {
          if (!this.isTrial() || noTrialEndOrInvalid) {
            return 0;
          }
          var hoursLeft = trialEndMoment.diff(moment(), 'hours');
          return Math.max(hoursLeft, 0);
        }
      };
    }

    function buildLink(org) {
      return {
        id: _.get(org, 'sys.id'),
        type: 'Link',
        linkType: 'Organization'
      };
    }
  }
]);
