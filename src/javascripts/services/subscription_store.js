'use strict';

/**
 * @ngdoc service
 * @name subscriptionStore
 *
 * @description
 * Uses global organizations state to build subscription objects.
 */
angular.module('contentful')
.factory('subscriptionStore', ['$injector', function ($injector) {

  var OrganizationList = $injector.get('OrganizationList');
  var spaceContext = $injector.get('spaceContext');
  var moment = $injector.get('moment');

  return {
    /**
     * @ngdoc method
     * @name subscriptionStore#get
     * @param {string} organizationId
     * @returns {object|null}
     * @description
     * Gets the subscription of an organization by its provided ID.
     */
    get: get,
    /**
     * @ngdoc method
     * @name subscriptionStore#getCurrent
     * @returns {object|null}
     * @description
     * Gets the current space's organization's subscription.
     */
    getCurrent: getCurrent
  };

  function get (organizationId) {
    var org = OrganizationList.get(organizationId);
    return org ? newFromOrganization(org) : null;
  }

  function getCurrent () {
    var org = spaceContext.getData('organization');
    return org ? newFromOrganization(org) : null;
  }

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
       * @todo: Correct behavior while `isTrial() == false`.
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
