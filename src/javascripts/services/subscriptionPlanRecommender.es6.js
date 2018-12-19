'use strict';

/**
 * @ngdoc service
 * @name subscriptionPlanRecommender
 *
 * @description
 * This service recommends a subscription plan for a given organization ID and
 * provides a rendered plan card.
 */
angular.module('contentful').factory('subscriptionPlanRecommender', [
  'require',
  require => {
    const $ = require('jquery');
    const Config = require('Config.es6');
    const $http = require('$http');
    const $q = require('$q');

    const ENDPOINT = Config.authUrl(
      '/account/organizations/:organization/z_subscription_plans/recommended'
    );

    return {
      /**
       * @ngdoc method
       * @name subscriptionPlanRecommender#recommend
       *
       * @description
       * Asks Gatekeeper for the most suitable subscription plan for a given
       * organization and provides its plan card and a reason why the plan is
       * so suitable as HTMLElement instances.
       *
       * @param {string} organizationId
       * @return {Promise<Object>} Provides an object with the following structure:
       * - {HTMLElement} plan      The rendered recommended subscription plan.
       * - {HTMLElement|undefined} reason An explanation why the recommended plan
       *                           is the most suitable one for the organization.
       */
      recommend: recommendSubscriptionPlan
    };

    function recommendSubscriptionPlan(organizationId) {
      const request = {
        method: 'GET',
        url: organizationEndpoint(organizationId),
        withCredentials: true
      };

      return $http(request).then(extractPlanHtml, reject);
    }

    function extractPlanHtml(response) {
      const html = $('<div>').append($(response.data));
      const plan = html.find('.z-subscription-plan');

      if (plan.length) {
        return {
          plan: plan.get(0),
          reason: html.find('.z-subscription-plan-recommendation-reason').get(0)
        };
      } else {
        return reject();
      }
    }

    function reject() {
      return $q.reject(new Error('Failed to make a plan recommendation'));
    }

    function organizationEndpoint(organizationId) {
      return ENDPOINT.replace(':organization', organizationId);
    }
  }
]);
