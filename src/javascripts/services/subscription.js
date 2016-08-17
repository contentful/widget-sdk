'use strict';

/**
 * @ngdoc service
 * @name Subscription
 *
 * @description
 * Represents an organization's subscription.
 */
angular.module('contentful')
.factory('Subscription', ['$injector', function ($injector) {

  var moment = $injector.get('moment');

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

  function newFromOrganization (org) {
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
       * @ngdoc property
       * @name Subscription#state
       * @type {string}
       * @description
       * Indicates the subscription's state. In most cases is...() methods are
       * more useful to find out about a subscription's state.
       */
      state: org.subscriptionState,
      /**
       * @ngdoc method
       * @name Subscription#isLimitedFree
       * @returns {boolean}
       * @description
       * Whether the subscription is a “Starter” or “Hacker” plan.
       *
       * NOTE: As long as `isTrial` is true this will return `false` even though
       *  the subscription might actually be on one of the above plans.
       *
       * TODO: Correct behavior while `isTrial() == false`.
       */
      isLimitedFree: _.constant(organizationHasLimitedFreeSubscription(org)),
      /**
       * @ngdoc method
       * @name Subscription#isTrial
       * @returns {boolean}
       * @description
       * Returns whether this is a trial subscription.
       */
      isTrial: _.constant(org.subscriptionState === 'trial'),
      /**
       * @ngdoc method
       * @name Subscription#hasTrialEnded
       * @returns {boolean}
       */
      hasTrialEnded: function () {
        return !this.isTrial() || !trialEndMoment.isAfter(moment());
      },
      /**
       * @ngdoc method
       * @name Subscription#getTrialHoursLeft
       * @returns {integer}
       */
      getTrialHoursLeft: function () {
        if (!this.isTrial() || noTrialEndOrInvalid) {
          return 0;
        }
        var hoursLeft = trialEndMoment.diff(moment(), 'hours');
        return Math.max(hoursLeft, 0);
      }
    };
  }

  function organizationHasLimitedFreeSubscription (org) {
    return org.subscriptionState === 'active' &&
        !org.subscriptionPlan.paid &&
        org.subscriptionPlan.kind === 'default';
  }

  function buildLink (org) {
    return {
      id: dotty.get(org, 'sys.id'),
      type: 'Link',
      linkType: 'Organization'
    };
  }
}]);
